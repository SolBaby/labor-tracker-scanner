import os
import psycopg2
from psycopg2 import sql

def get_db_connection():
    return psycopg2.connect(
        host=os.environ['PGHOST'],
        database=os.environ['PGDATABASE'],
        user=os.environ['PGUSER'],
        password=os.environ['PGPASSWORD'],
        port=os.environ['PGPORT']
    )

def execute_query(query, params=None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
            conn.commit()
            if cur.description:
                return cur.fetchall()
    finally:
        conn.close()

def list_employees():
    query = "SELECT * FROM employee;"
    return execute_query(query)

def add_employee(name, employee_id, department):
    query = "INSERT INTO employee (name, employee_id, department) VALUES (%s, %s, %s);"
    execute_query(query, (name, employee_id, department))

def update_employee(id, name, employee_id, department):
    query = "UPDATE employee SET name = %s, employee_id = %s, department = %s WHERE id = %s;"
    execute_query(query, (name, employee_id, department, id))

def delete_employee(id):
    query = "DELETE FROM employee WHERE id = %s;"
    execute_query(query, (id,))

def main():
    while True:
        print("\n1. List all employees")
        print("2. Add new employee")
        print("3. Update employee")
        print("4. Delete employee")
        print("5. Execute custom SQL query")
        print("6. Exit")
        
        choice = input("Enter your choice (1-6): ")
        
        if choice == '1':
            employees = list_employees()
            for emp in employees:
                print(emp)
        elif choice == '2':
            name = input("Enter employee name: ")
            employee_id = input("Enter employee ID: ")
            department = input("Enter department: ")
            add_employee(name, employee_id, department)
            print("Employee added successfully.")
        elif choice == '3':
            id = input("Enter employee ID to update: ")
            name = input("Enter new name: ")
            employee_id = input("Enter new employee ID: ")
            department = input("Enter new department: ")
            update_employee(id, name, employee_id, department)
            print("Employee updated successfully.")
        elif choice == '4':
            id = input("Enter employee ID to delete: ")
            delete_employee(id)
            print("Employee deleted successfully.")
        elif choice == '5':
            query = input("Enter your SQL query: ")
            result = execute_query(query)
            if result:
                for row in result:
                    print(row)
            print("Query executed successfully.")
        elif choice == '6':
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
