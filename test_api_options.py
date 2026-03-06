import urllib.request as request
import urllib.error

url = 'https://orbiflow.onrender.com/api/v1/auth/register'

req = request.Request(url, method='OPTIONS', headers={
    'Origin': 'https://orbiflow-frontend.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
})
try:
    resp = request.urlopen(req)
    print("SUCCESS OPTIONS", resp.getcode())
    print("Headers:", resp.headers)
except urllib.error.HTTPError as e:
    print("FAIL OPTIONS HTTP", e.code, e.reason, e.read())
except Exception as e:
    print("FAIL OTHER", str(e))
