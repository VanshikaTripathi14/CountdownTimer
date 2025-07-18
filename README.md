# CountdownTimer
Overview
A responsive web application that allows users to create and manage multiple countdown timers simultaneously. Each timer can be individually controlled, named, and deleted.

Features
🕒 Create multiple countdown timers

✏️ Name each timer for easy identification

⏱️ Set precise end dates and times

🚫 Independent delete buttons for each timer

🎉 Visual completion notification

📱 Fully responsive design (works on mobile and desktop)

Installation
No installation required! Simply open index.html in any modern web browser.

How to Use
Add a new timer: Click the "+ Add New Timer" button

Name your timer: Type a name in the "Event Name" field (optional)

Set end time: Choose a future date and time using the datetime picker

Start countdown: Click the "Start Countdown" button

Delete timers: Click the × button on any timer to remove it

File Structure
```
countdown-timer/
├── index.html        # Main HTML file
├── styles.css        # CSS styles
└── script.js         # JavaScript functionality
```

Technical Details
HTML5 for structure

CSS3 with Flexbox for layout

Vanilla JavaScript (no frameworks)

Uses setInterval() for countdown updates

Each timer maintains its own independent state

Customization Options
Uncomment these features in script.js if desired:

Sound notification when timer completes

Additional animations

Browser Support
Tested on:

Chrome (latest)

Firefox (latest)

Edge (latest)

Safari (latest)

License
This project is open source and available under the MIT License.

Future Enhancements
Save timers between sessions using localStorage

Add pause/resume functionality

Custom alert sounds

Shareable timer links
