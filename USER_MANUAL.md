# Logistics Management System – User Manual

## 1. Introduction

This manual explains how to use our Logistics Management System (LMS). With this system, you can log in, check the stock in the warehouse, create waybills and update the status of shipments.

At the moment, four pages work: **Sign in**, **Orders**, **Waybills** and **Inventory**. The other items in the left menu (Overview, Tracking, Fleet, Customers and Settings) are not finished yet. If you click them, you will only see a message saying they are planned for a future version.

One thing to know first: **Orders and Waybills show the same shipments.** They are two pages for the same data, and only the title is different.

## 2. Before You Start

You need to install:

- Python 3
- Node.js 22.12 or newer

Ports 8000 and 3000 on your computer must be free, because the system uses them.

### Starting the system on Windows

1. Open PowerShell in the project folder (the folder that has the file `start.ps1`).
2. Type `.\start.ps1` and press Enter.
3. Wait a moment. The script installs what the system needs and starts it. Your browser will open the system automatically.
4. When you see "Startup successful!", the system is ready.
5. Do not close the PowerShell window while you are using the system. When you finish, go back to that window and press Enter to stop it.

If you do not want the browser to open by itself, run `.\start.ps1 -NoBrowser` instead.

### Starting the system on other computers

1. Open a terminal in the project folder and run `python3 backend/server.py`. On Windows you can use `py -3 backend/server.py`.
2. Open a second terminal and run these three commands one by one: `cd frontend`, then `npm ci`, then `npm run dev`.
3. Open your browser and go to `http://localhost:3000`.

## 3. Signing In and Signing Out

### Signing in

1. Go to `http://localhost:3000`. If you have not signed in, you will see the **Sign in** page.
2. Type `demo` in **Username** and `demo123` in **Password**. The demo account is also shown at the bottom of the page.
3. Click **Sign in**.
4. You will see "Welcome back, demo" and the **Orders** page opens.

Only the demo account can be used right now. There is no sign-up page and no "forgot password" function.

### Signing out

1. Click your name (`demo`) at the top right corner of the page.
2. Click **Sign out** in the small menu.
3. You will see "Signed out" and go back to the Sign in page.

### If the system stops working suddenly

If the backend is restarted, you will be sent back to the Sign in page. Just sign in again. Your data is not lost.

## 4. Inventory

Click **Inventory** in the left menu to see the items in stock.

At the top, two boxes show the number of **Items** and the total **Available stock**. Below is a table with four columns: **SKU**, **Item name**, **Available stock** and **Unit price (HKD)**.

- **To search:** type a SKU or an item name in the search box at the top right. The table updates while you type.
- **To refresh:** click **Refresh** to get the latest stock. It is a good idea to do this after you create a waybill.
- If nothing matches your search, the table says "No matching inventory records".

The system starts with three items: `TECH-WM-001` (Wireless Optical Mouse), `TECH-KB-002` (Mechanical Gaming Keyboard) and `TECH-CB-003` (USB-C Fast Charging Cable). On this page you can only look at the stock. You cannot add, edit or delete items.

## 5. Orders and Waybills

Click **Orders** or **Waybills** in the left menu. Both pages work in the same way.

At the top there are four boxes: **Total shipments**, **Pending pickup**, **In transit** and **Delivered**. The **Refresh** and **New waybill** buttons are at the top right.

### Reading the table

| Column | What it shows |
| --- | --- |
| Tracking number | The number of the shipment |
| Cargo / SKU / Quantity | What is being sent and how many |
| Sender → Receiver | Who sends it, who receives it, and the receiver's phone number |
| Delivery address | Where it is going |
| Status | The current status |

The newest shipment is at the top. Use **Previous** and **Next** below the table to change page. If you cannot see the Status column, scroll the table to the right.

### Searching and filtering

- **Filter by status:** use the drop-down on the left. You can choose **All statuses**, **Pending pickup**, **In transit** or **Delivered**.
- **Search:** type in the search box on the right. You can search by tracking number, sender, receiver name, address, SKU or item name. You cannot search by phone number.

### Creating a waybill

1. Click **New waybill**. A form will pop up. The sender is the account you are using.
2. Pick a **SKU** from the list. Each choice also shows the item name and how many are in stock.
3. Type the **Quantity**. It must be a whole number, 1 or more. If the number is bigger than the stock, you will see "Exceeds available stock" and the button will be greyed out, so you need to type a smaller number.
4. Fill in **Receiver**, **Receiver phone** and **Delivery address**. All fields marked with an asterisk (*) must be filled in.
5. To discard the form, click **Cancel** before submitting. When ready, click **Create and deduct stock**. Closing the form after submitting leaves the request running, and a successful request still creates the waybill and deducts stock.
6. The confirmation shows the tracking number and the quantity deducted. To find the new **Pending pickup** shipment, select **All statuses** and enter that tracking number in the shipment search box.

Good to know:

- One waybill can only have **one SKU**. If you want to send two different items, make two waybills.
- The tracking number is made by the system. It starts with `HK`, then the date (YYYYMMDD), then a running number.
- The stock is taken away as soon as the waybill is created.

### Changing the status of a shipment

1. Find the shipment in the table.
2. Click the drop-down in the **Status** column.
3. Choose **Pending pickup**, **In transit** or **Delivered**.
4. You will see "Status updated to …" and the table reloads.



## 6. Troubleshooting

| What you see | What it means | What to do |
| --- | --- | --- |
| Enter your username and password | One of the boxes on the Sign in page is empty | Fill in both boxes |
| invalid credentials | Wrong username or password | Use `demo` and `demo123` |
| Network error. Check your connection | The page cannot reach the backend | Make sure the backend is running, then try again |
| You are sent back to the Sign in page | You were logged out, usually because the backend restarted | Sign in again |
| Could not load inventory / Could not load shipments | The data did not load | Click **Retry** or **Refresh** |
| Select a SKU and enter a positive quantity, receiver, phone and address | The waybill form is not complete, or the quantity is not a whole number above 0 | Check every field in the form |
| Exceeds available stock | The quantity is more than what is in stock | Type a smaller quantity |
| insufficient inventory | The stock was used up before your waybill was saved, for example another user created a waybill first | Click **Refresh**, check the stock, then try a smaller quantity |
| Unable to create waybill / Unable to update status | Something went wrong when saving | Try again. If it keeps happening, look at the backend window for error messages |
| Port 8000 (or 3000) is already in use | Another program is using the port | Close that program and run `start.ps1` again |
| Node.js 22.12.0 or later is required | Your Node.js is too old | Install Node.js 22.12 or newer |
| A page with a construction icon | That page is not finished yet | Use Orders, Waybills or Inventory |

## 7. Current Limitations

These functions are **not** available in the current version:

- Registering a new account, or resetting a password
- Different user roles (everyone who logs in sees the same pages)
- The Overview, Tracking, Fleet, Customers and Settings pages (they are empty placeholders)
- A page to see the tracking history of a shipment
- A detail page for each shipment
- An address book, shipping fees or service types
- Waybills with more than one item
- Assigning couriers or dispatching
- Signature or proof of delivery
- Adding or editing items, or recording stock coming in
- Cancelling or deleting a shipment
