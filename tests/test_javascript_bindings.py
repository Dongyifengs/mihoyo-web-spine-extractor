import json

import pytest

from spine_extractor.discovery import Scanner
from spine_extractor.matching import pair_assets


@pytest.mark.parametrize('table', ['array', 'object'])
def test_explicit_webpack_asset_registrations(skeleton, atlas, table):
    other = json.loads(json.dumps(skeleton))
    other['skeleton']['hash'] = 'different'
    functions = [
        'function(e,t,r){var assets={hero:{atlas:r(1),json:r(2)},other:{atlas:r(3),json:r(4)}}}',
        'function(e){e.exports='+json.dumps(atlas)+'}',
        'function(e){e.exports=JSON.parse('+json.dumps(json.dumps(skeleton))+')}',
        'function(e){e.exports='+json.dumps(atlas.replace('hero.png','other.png'))+'}',
        'function(e){e.exports=JSON.parse('+json.dumps(json.dumps(other))+')}',
    ]
    script = '['+','.join(functions)+']' if table == 'array' else '({'+','.join(str(i)+':'+f for i,f in enumerate(functions))+'})'
    scanner = Scanner('https://example.test/bundle.js')
    scanner.scan_js(script, scanner.page_url)
    pairs = pair_assets(scanner.skeletons, scanner.atlases)
    assert [(p.skeleton.name, p.atlas.name) for p in pairs] == [('hero.json','hero.atlas'),('other.json','other.atlas')]
