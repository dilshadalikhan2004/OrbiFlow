import urllib.request
import json
import urllib.error

def main():
    try:
        data = json.dumps({'email': 'dilshadalikhanji123@gmail.com', 'password': 'Password123!'}).encode('utf-8')
        req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as f:
            resp = json.loads(f.read())
            token = resp['access_token']
        print("Got token")
    except Exception as e:
        print('Auth Error:', e)
        return

    req_proj = urllib.request.Request('http://localhost:8000/api/v1/projects/', headers={'Authorization': f'Bearer {token}'})
    proj_id = None
    with urllib.request.urlopen(req_proj) as f:
        projects = json.loads(f.read())
        if projects: proj_id = projects[0]['id']
    
    if proj_id:
        print("Got project", proj_id)
        task_data = json.dumps({'title': 'Test UI', 'project_id': proj_id, 'priority': 'high', 'deadline': '2026-03-07'}).encode('utf-8')
        req_task = urllib.request.Request('http://localhost:8000/api/v1/tasks/', data=task_data, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
        try:
            with urllib.request.urlopen(req_task) as f:
                print('Success:', f.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            print('Task creation HTTP error:', e.code)
            print('Error body:', e.read().decode('utf-8'))

if __name__ == '__main__':
    main()
