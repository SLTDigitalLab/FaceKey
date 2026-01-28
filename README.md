# Visage Edge Dashboard

This is a standalone dashboard for the Visage Edge Building Access Control system. It allows you to manage buildings, doors, and authorized users (employees).

## Setup

1.  Navigate to this folder: `cd Visage-dashboard`
2.  Install dependencies: `pip install -r requirements.txt`
3.  Run the application: `python main.py`

## Features

-   **Dashboard Overview**: View statistics and recent activity.
-   **Buildings Management**: Add/Edit/Delete buildings.
-   **Door Management**: Add/Edit/Delete doors and assign them to buildings.
-   **Employee Management**: Link employees from the central server and assign door access permissions.
-   **Access Logs**: View history of door access events.

## Data

All data is stored in JSON files in the `Data/door_access/` .
