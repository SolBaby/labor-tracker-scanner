import os
import psycopg2
from psycopg2 import sql
from tabulate import tabulate

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
    employees = execute_query(query)
    headers = ["ID", "Name", "Employee ID", "Department"]
    print(tabulate(employees, headers=headers, tablefmt="grid"))

def add_employee(name, employee_id, department):
    query = "INSERT INTO employee (name, employee_id, department) VALUES (%s, %s, %s);"
    try:
        execute_query(query, (name, employee_id, department))
        print("Employee added successfully.")
    except psycopg2.Error as e:
        print(f"Error adding employee: {e}")

def get_employee(id):
    query = "SELECT * FROM employee WHERE id = %s;"
    result = execute_query(query, (id,))
    if result:
        return result[0]
    return None

def update_employee(id, field, value):
    valid_fields = ['name', 'employee_id', 'department']
    if field not in valid_fields:
        print(f"Invalid field. Choose from: {', '.join(valid_fields)}")
        return
    
    query = sql.SQL("UPDATE employee SET {} = %s WHERE id = %s;").format(sql.Identifier(field))
    try:
        execute_query(query, (value, id))
        print("Employee updated successfully.")
    except psycopg2.Error as e:
        print(f"Error updating employee: {e}")

def delete_employee(id):
    query = "DELETE FROM employee WHERE id = %s;"
    try:
        execute_query(query, (id,))
        print("Employee deleted successfully.")
    except psycopg2.Error as e:
        print(f"Error deleting employee: {e}")

def get_database_schema():
    query = """
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
    """
    schema = execute_query(query)
    headers = ["Table", "Column", "Data Type", "Nullable"]
    print(tabulate(schema, headers=headers, tablefmt="grid"))

def list_tables():
    query = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
    """
    tables = execute_query(query)
    print("Tables in the database:")
    for table in tables:
        print(table[0])

def execute_custom_query(query):
    try:
        result = execute_query(query)
        if result:
            headers = [desc[0] for desc in result[0].cursor_description]
            print(tabulate(result, headers=headers, tablefmt="grid"))
        else:
            print("Query executed successfully. No results returned.")
    except Exception as e:
        print(f"Error executing query: {str(e)}")

def main():
    while True:
        print("\n--- Employee Management System ---")
        print("1. List all employees")
        print("2. Add new employee")
        print("3. Update employee")
        print("4. Delete employee")
        print("5. Show employee details")
        print("6. Execute custom SQL query")
        print("7. Show database schema")
        print("8. List all tables")
        print("9. Exit")
        
        choice = input("Enter your choice (1-9): ")
        
        if choice == '1':
            list_employees()
        elif choice == '2':
            name = input("Enter employee name: ")
            employee_id = input("Enter employee ID: ")
            department = input("Enter department: ")
            add_employee(name, employee_id, department)
        elif choice == '3':
            id = input("Enter employee ID to update: ")
            employee = get_employee(id)
            if employee:
                print("Current employee details:")
                print(f"Name: {employee[1]}")
                print(f"Employee ID: {employee[2]}")
                print(f"Department: {employee[3]}")
                field = input("Enter field to update (name/employee_id/department): ")
                value = input(f"Enter new {field}: ")
                update_employee(id, field, value)
            else:
                print("Employee not found.")
        elif choice == '4':
            id = input("Enter employee ID to delete: ")
            delete_employee(id)
        elif choice == '5':
            id = input("Enter employee ID to view details: ")
            employee = get_employee(id)
            if employee:
                headers = ["ID", "Name", "Employee ID", "Department"]
                print(tabulate([employee], headers=headers, tablefmt="grid"))
            else:
                print("Employee not found.")
        elif choice == '6':
            query = input("Enter your SQL query: ")
            execute_custom_query(query)
        elif choice == '7':
            get_database_schema()
        elif choice == '8':
            list_tables()
        elif choice == '9':
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
