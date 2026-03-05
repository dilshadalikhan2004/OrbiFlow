import sqlite3

def update_role():
    try:
        conn = sqlite3.connect('enterprise.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role='ADMIN' WHERE email='dilshadalikhanji123@gmail.com'")
        print(f"Rows affected: {cursor.rowcount}")
        
        cursor.execute("UPDATE users SET role='admin' WHERE email='dilshadalikhanji123@gmail.com'")
        print(f"Rows affected (lowercase): {cursor.rowcount}")
        
        conn.commit()
        
        cursor.execute("SELECT email, role FROM users")
        print(cursor.fetchall())
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    update_role()
