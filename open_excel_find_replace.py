import win32com.client as win32
import time

try:
    # Create an instance of Excel
    print("Starting Excel...")
    excel = win32.Dispatch("Excel.Application")
    excel.Visible = True

    # Open the Excel file
    print("Opening Excel file...")
    workbook = excel.Workbooks.Open(r"D:\Reflow Oven Desktop App\PCB_Data.xlsx")  # Update path

    # Wait for Excel to fully open
    time.sleep(2)

    # Trigger "Find and Replace" window
    print("Triggering 'Find and Replace' window...")
    excel.Application.SendKeys("^h")  # ^ represents Ctrl, and 'h' is for "Find and Replace"

    print("Script finished successfully.")
except Exception as e:
    print(f"Error: {str(e)}")
