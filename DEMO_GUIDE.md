# 🔐 TriLock Security PRO - Setup & Demo Guide

Welcome to the **TriLock Security PRO** project! This guide is designed for first-timers to completely set up the development environment, deploy the app to an Android phone, and perform a live demonstration of the 3-phase biometric and BLE security system—all within **30 minutes**.

---

## ⏱️ The 30-Minute Roadmap
* **Phase 1:** Environment Setup (10 mins)
* **Phase 2:** Phone Preparation (5 mins)
* **Phase 3:** Build & Deploy (10 mins)
* **Phase 4:** The Live Demo (5 mins)

---

## 🛠️ Phase 1: Environment Setup (10 mins)

Before we begin, ensure you have the following installed on your computer:
1. **Node.js** (v18 or higher): [Download Here](https://nodejs.org/)
2. **Git**: [Download Here](https://git-scm.com/)
3. **Android Studio**: [Download Here](https://developer.android.com/studio)

### Setting up Android Studio:
1. Run the Android Studio installer and follow the default prompts.
2. Open Android Studio. It will prompt you to install the **Android SDK**. Accept the default settings and let it download.
3. Once you see the "Welcome to Android Studio" screen, you are ready.

---

## 📱 Phase 2: Phone Preparation (5 mins)

To install the app directly from your computer to your phone, you need to enable **Developer Mode** and **USB Debugging**.

1. Open your phone's **Settings**.
2. Scroll down and tap **About Phone**.
3. Find the **Build Number** (sometimes located under "Software Information").
4. **Tap "Build Number" 7 times** rapidly. You will see a toast message saying *"You are now a developer!"*
5. Go back to the main **Settings** menu and find **Developer Options** (often at the very bottom or under "System").
6. Scroll down and toggle **USB Debugging** to **ON**.
7. Connect your phone to your computer using a USB cable. If a prompt appears on your phone asking to "Allow USB debugging?", check "Always allow from this computer" and tap **Allow**.

---

## 💻 Phase 3: Build & Deploy (10 mins)

Now we will download the code, install dependencies, and push the app to your phone.

### 🪟 Special Note for Windows Users:
* **Open Terminal:** Press the `Windows` key, type `powershell` or `cmd`, and hit **Enter**.
* **Execution Policies:** If PowerShell gives you an error when running `npx` or `npm`, run this command first: `Set-ExecutionPolicy Unrestricted -Scope CurrentUser`
* **Android Studio Path:** If `npx cap open android` doesn't automatically launch Android Studio, simply open Android Studio manually, click **Open**, and select the `android` folder located inside your project directory.

### 1. Clone the Repository
Open your computer's Terminal (Mac/Linux) or Command Prompt/PowerShell (Windows) and run:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_NAME>
```
*(Replace `<YOUR_GITHUB_REPO_URL>` with the actual URL of this repository).*

### 2. Install Dependencies
Run the following command to install all required Node packages:
```bash
npm install
```

### 3. Build the Web Assets
Compile the React/TypeScript code into static web assets:
```bash
npm run build
```

### 4. Sync with Capacitor (Android)
Copy the built web assets into the native Android project:
```bash
npx cap sync android
```

### 5. Open in Android Studio
Launch the Android project directly from your terminal:
```bash
npx cap open android
```

### 6. Run the App on Your Phone
1. Android Studio will open and begin indexing the project (this takes a minute or two; watch the loading bar at the bottom right).
2. Using a USB cable connect your phone to your PC. Look at the top toolbar in Android Studio. You should see your physical Android phone listed in the device dropdown menu.
3. Click the green **Play (Run)** button ▶️ next to your device name.
4. The app will compile and automatically launch on your phone!

---

## 🎭 Phase 4: The Live Demo (5 mins)

To demonstrate the physical hardware integration without needing a real ESP32/Arduino wired up, we will use a second phone (or tablet) to simulate the smart lock.

### Step A: Set up the "Virtual Smart Lock"
1. On a **second smartphone** (iOS or Android), download the free app **nRF Connect for Mobile** (or **LightBlue**).
2. Open the app and navigate to the **Advertiser** (or Virtual Peripheral) tab.
3. Create a new advertisement packet:
   * **Device Name:** Set this to `SmartLock`
   * **Services:** Add a new service with the UUID `1234`
4. Start broadcasting/advertising. This phone is now acting exactly like your ESP32 hardware lock!

### Step B: The TriLock App Demo
Grab your main phone (the one running the TriLock app) and follow these steps to wow your audience:

1. **Open the TriLock App.** You will be greeted by the sleek, dark-themed Monitoring dashboard.
2. **Navigate to Management:** Tap the "Management" tab at the top.
3. **Scan for Hardware:** 
   * Scroll down to the **Link Real BLE** section.
   * Tap **Scan Nearby Devices**.
   * The app will use your phone's native Bluetooth to scan the room.
4. **Link the Lock:** 
   * Within a few seconds, `SmartLock` (your second phone) will appear in the list along with its signal strength.
   * Tap **Link**. The app has now securely bound to this hardware MAC address.
5. **The Auto-Unlock Sequence:**
   * Switch back to the **Monitoring** tab.
   * Because the "SmartLock" is currently broadcasting and in range, **Phase 01 (PROXIMITY)** will automatically verify and light up blue!
6. **Complete the Biometrics:**
   * Tap **Phase 02 (BIOMETRIC)** to simulate a successful fingerprint scan.
   * Tap **Phase 03 (VEIN MAP)** to simulate the final biometric verification.
7. **The Grand Finale:**
   * Once all three phases are verified, the central lock visualizer will turn green and unlock.
   * Look at the **Live Event Stream** log on the right. You will see the message: `"ESP32 Relay Triggered. System fully disengaged."`
   * *Explain to your audience:* At this exact moment, the app transmitted the encrypted `"UNLOCK"` byte array over Bluetooth to the ESP32, triggering Pin 5 and physically opening the door.

### Step C: The Auto-Lock Demo
1. On your second phone (the virtual lock), **stop broadcasting** (or turn off its Bluetooth).
2. Look at the TriLock app. Within seconds, it will detect the signal loss.
3. The system will instantly revert to a locked state, and the activity log will display: `"Auto-Lock: Linked Bluetooth device went out of range."`

---

## 🎉 Congratulations!
You have successfully deployed and demonstrated a native Android application utilizing React, Capacitor, and native Bluetooth Low Energy APIs to interact with physical hardware.
