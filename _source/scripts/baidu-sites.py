"""在本机查询百度统计站点 ID；令牌只在交互式终端中输入。"""

import getpass
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


def main():
    if not sys.stdin.isatty():
        raise SystemExit('请在交互式终端中运行此脚本。')
    token = getpass.getpass('百度统计 Access Token（输入时不显示）: ').strip()
    if not token:
        raise SystemExit('未输入令牌。')
    url = 'https://openapi.baidu.com/rest/2.0/tongji/config/getSiteList?' + urlencode({'access_token': token})
    try:
        with urlopen(url, timeout=25) as response:
            data = json.load(response)
    except HTTPError as exc:
        raise SystemExit(f'百度统计 API 返回 HTTP {exc.code}，请检查授权。') from None
    except (URLError, OSError, ValueError):
        raise SystemExit('无法读取百度统计站点列表，请检查网络和授权。') from None
    sites = data.get('list')
    if not isinstance(sites, list):
        raise SystemExit('百度统计未返回站点列表，请检查数据导出服务和令牌有效期。')
    matching = [site for site in sites if str(site.get('domain', '')).lower().rstrip('/') == 'spine.moyijiangnan.cn']
    if not matching:
        raise SystemExit('未找到 spine.moyijiangnan.cn，请确认使用的是正确的百度统计账号。')
    for site in matching:
        print('站点:', site.get('domain'), '  SITE_ID:', site.get('site_id'))


if __name__ == '__main__':
    main()
