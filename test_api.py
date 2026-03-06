import urllib.request as request
import urllib.error

url = 'https://orbiflow.onrender.com/api/v1/auth/register'
data = b'{"name":"test","email":"test1@test.com","password":"password","role":"employee"}'

req = request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    resp = request.urlopen(req)
    print("SUCCESS", resp.read())
except urllib.error.HTTPError as e:
    print("FAIL HTTP", e.code, e.reason, e.read())
except Exception as e:
    print("FAIL OTHER", str(e))
