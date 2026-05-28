# TrueSign - Run Instructions (Updated)

I have created two easy-to-use batch scripts in your `d:\mini project\final\` directory to instantly host your frontend and backend. 

### Method 1: The Easy Way (Double Click) 🚀
1. **Start the Backend**: Double-click the `start_backend.bat` file in your `final` folder. A black console window will open, activate your python environment, and start the AI API. Wait until it says `Uvicorn running`.
2. **Start the Frontend**: Double-click the `start_frontend.bat` file. Another window will open and give you the local URL (like `https://localhost:5173/`).

### Method 2: Manual Terminal Commands 💻
If you prefer running them in VS Code terminals:

**Backend Terminal:**
```powershell
cd "d:\mini project\final\truesign-backend"
$env:PYTHONIOENCODING="utf-8"
& "d:\mini project\True_Sign\venv_mp\Scripts\python.exe" run_backend.py
```

**Frontend Terminal:**
```powershell
cd "d:\mini project\final\frontend_redesign"
npm run dev
```

### Accessing on Mobile 📱
1. Make sure your phone is on the **same Wi-Fi**.
2. Look at the Frontend terminal window for the **Network** `https://192.168.x.x:5173/` address.
3. Open it on your phone.
4. Bypass the "Not Private" warning by clicking **Advanced -> Proceed to [IP Address]**. 
5. The local SSL allows your phone browser to grant Camera access!
