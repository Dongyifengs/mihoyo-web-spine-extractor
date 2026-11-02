"""Small, serializable job records for resumable batch imports and offline diagnosis."""
from collections import Counter

CATEGORIES = ('network', 'entry', 'atlas', 'texture', 'version', 'scan', 'metadata', 'unknown')
LABELS = dict(zip(CATEGORIES, ('网络请求', '活动入口', '图集匹配', '贴图匹配', '运行时版本', '资源扫描', '项目信息', '其他')))


class EmptyActivity(ValueError):
    pass


def normal_status(row):
    status, message = row.get('status'), row.get('message', '')
    if status == 'needs-adapter' and '文章内没有官方活动超链接' in message:
        return 'no-link'
    if status == 'needs-adapter' and '尚未识别到可验证的 Spine' in message:
        return 'empty'
    return status


class AssetValidationError(ValueError):
    def __init__(self, issues, evidence):
        super().__init__('; '.join(issues[:10]))
        self.issues = issues
        self.evidence = evidence


def categories(message, stage='unknown'):
    rules = {
        'network': ('读取失败', '未收到有效响应', '接口', '连接', 'HTTP', 'timeout'),
        'entry': ('超链接', '短链接', '入口'),
        'texture': ('贴图', '纹理'),
        'atlas': ('图集匹配', '图集区域', '图集页面'),
        'version': ('骨骼版本', '运行时'),
        'scan': ('尚未识别到', '扫描达到', '内嵌资源定位'),
        'metadata': ('封面', '自动命名', '场景不一致'),
    }
    return [key for key, words in rules.items() if any(word in message for word in words)] or [stage]


def failure_record(error, stage, row, links=()):
    issues = getattr(error, 'issues', [str(error)])
    return {'key': row['key'], 'title': row['title'], 'categories': sorted(set(c for issue in issues for c in categories(issue, stage))),
            'message': str(error), 'links': list(links), 'issues': issues, 'evidence': getattr(error, 'evidence', {})}


def failed_jobs(state, report):
    jobs = {}
    for key, item in state.get('articles', {}).items():
        if normal_status(item) in {'no-link', 'empty'}:
            continue
        failure = item.get('lastFailure')
        if failure:
            jobs[key] = failure
        elif item.get('status') == 'needs-adapter':
            jobs[key] = failure_record(ValueError(item.get('message', '待重试')), 'unknown', {'key': key, 'title': key})
    for row in report.get('items', []):
        status = normal_status(row)
        if status in {'needs-adapter', 'unavailable'}:
            jobs[row['key']] = row.get('failure') or failure_record(ValueError(row.get('message', '待重试')), 'unknown', row, row.get('links', []))
        elif status in {'complete', 'unchanged', 'no-link', 'empty'}:
            jobs.pop(row['key'], None)
    return jobs


def select_jobs(rows, failures, retry_failed=False, category=None, limit=0):
    selected = [row for row in rows if (not retry_failed or row['key'] in failures)
                and (not category or category in failures.get(row['key'], {}).get('categories', []))]
    return selected[:limit] if limit else selected


def summarize(jobs):
    counts = Counter(category for item in jobs.values() for category in item['categories'])
    return {'total': len(jobs), 'categories': dict(counts), 'items': list(jobs.values())}
