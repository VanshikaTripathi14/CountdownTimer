document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const addTimerBtn = document.getElementById('addTimerBtn');
    const timersContainer = document.getElementById('timersContainer');
    const timerTemplate = document.getElementById('timerTemplate');

    // --- Timer State Management ---
    let timers = []; // Stores objects for each timer: { id, element, interval, targetTime }
    let audioContextUnlocked = false; // To handle browser audio policies

    // --- Event Listeners ---
    addTimerBtn.addEventListener('click', addNewTimer);

    // --- Functions ---
    
    /**
     * Shows a toast notification.
     * @param {string} text The message to display.
     * @param {boolean} isError True for error style, false for success.
     */
    function showToast(text, isError = false) {
        Toastify({
            text: text,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: isError 
                    ? "linear-gradient(to right, #F44336, #D32F2F)" 
                    : "linear-gradient(to right, #00b09b, #96c93d)",
            },
        }).showToast();
    }
    
    /**
     * Unlocks the browser's audio context on the first user interaction.
     */
    function unlockAudio() {
        if (audioContextUnlocked) return;
        // A silent sound can be played to activate the audio context
        const audio = new Audio('sounds/more.mp3');
        audio.play().then(() => {
            audioContextUnlocked = true;
        }).catch(() => {
            // Even if it fails, we'll try again on completion
        });
    }

    /**
     * Creates and adds a new timer to the DOM.
     */
    function addNewTimer() {
        const newTimerEl = timerTemplate.cloneNode(true);
        newTimerEl.id = '';
        newTimerEl.classList.remove('timer-template');
        
        const timerItem = newTimerEl.querySelector('.timer-item');
        timersContainer.appendChild(timerItem);
        
        const timerId = `timer_${Date.now()}`;
        timerItem.dataset.id = timerId;

        const timerNameInput = timerItem.querySelector('.timer-name');
        const datetimeInput = timerItem.querySelector('.datetime');
        const now = new Date();
        now.setDate(now.getDate() + 1);
        datetimeInput.value = now.toISOString().substring(0, 16);
        timerNameInput.value = `New Event`;

        const startBtn = timerItem.querySelector('.start-btn');
        startBtn.addEventListener('click', () => startCountdown(timerId));
        
        const stopBtn = timerItem.querySelector('.stop-btn');
        stopBtn.addEventListener('click', () => stopCountdown(timerId));

        const deleteBtn = timerItem.querySelector('.delete-timer');
        deleteBtn.addEventListener('click', () => deleteTimer(timerId));
        
        datetimeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                startCountdown(timerId);
            }
        });
        
        datetimeInput.addEventListener('input', () => {
            const errorBox = timerItem.querySelector('.error-box');
            hideError(errorBox);
        });

        timers.push({ id: timerId, element: timerItem, interval: null, targetTime: null });
        showToast("New timer added!");
    }

    async function deleteTimer(timerId) {
        const timerIndex = timers.findIndex(t => t.id === timerId);
        if (timerIndex === -1) return;

        const timerName = timers[timerIndex].element.querySelector('.timer-name').value || 'This Timer';

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete the "${timerName}" timer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: 'var(--danger-color)',
            background: 'var(--surface-color)',
            color: 'var(--text-primary)'
        });

        if (result.isConfirmed) {
            stopCountdown(timerId);
            timers[timerIndex].element.style.animation = 'popIn 0.5s ease-out reverse';
            timers[timerIndex].element.addEventListener('animationend', () => {
                 timers[timerIndex].element.remove();
            });
           
            timers.splice(timerIndex, 1);
        }
    }

    function startCountdown(timerId) {
        unlockAudio(); // Attempt to unlock audio on first start
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return;

        const timerElement = timer.element;
        const datetimeInput = timerElement.querySelector('.datetime');
        const errorBox = timerElement.querySelector('.error-box');

        if (timer.interval) clearInterval(timer.interval);
        hideError(errorBox);

        const selectedDatetime = new Date(datetimeInput.value).getTime();
        const currentTime = new Date().getTime();

        if (!datetimeInput.value || isNaN(selectedDatetime)) {
            showError(errorBox, 'Please select a valid date and time.');
            return;
        }
        if (selectedDatetime <= currentTime) {
            showError(errorBox, 'Please select a future date and time.');
            return;
        }
        
        timer.targetTime = selectedDatetime;
        timerElement.classList.add('running');

        updateCountdown(timer);
        timer.interval = setInterval(() => updateCountdown(timer), 1000);
    }

    function stopCountdown(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer || !timer.interval) return;

        clearInterval(timer.interval);
        timer.interval = null;
        timer.element.classList.remove('running');
    }

    function updateCountdown(timer) {
        const timeRemaining = timer.targetTime - new Date().getTime();

        if (timeRemaining <= 0) {
            stopCountdown(timer.id);
            
            updateNumber(timer.element.querySelector('[data-unit="days"]'), '00');
            updateNumber(timer.element.querySelector('[data-unit="hours"]'), '00');
            updateNumber(timer.element.querySelector('[data-unit="minutes"]'), '00');
            updateNumber(timer.element.querySelector('[data-unit="seconds"]'), '00');

            const timerName = timer.element.querySelector('.timer-name').value || 'Timer';
            showToast(`"${timerName}" has finished! 🎉`);
            playCompletionSound();
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        updateNumber(timer.element.querySelector('[data-unit="days"]'), formatTime(days));
        updateNumber(timer.element.querySelector('[data-unit="hours"]'), formatTime(hours));
        updateNumber(timer.element.querySelector('[data-unit="minutes"]'), formatTime(minutes));
        updateNumber(timer.element.querySelector('[data-unit="seconds"]'), formatTime(seconds));
    }
    
    function updateNumber(containerEl, newText) {
        const oldNumberEl = containerEl.querySelector('.number');
        if (oldNumberEl.textContent === newText) return;

        const newNumberEl = document.createElement('div');
        newNumberEl.classList.add('number', 'slide-in');
        newNumberEl.textContent = newText;

        oldNumberEl.classList.add('slide-out');
        
        containerEl.appendChild(newNumberEl);

        // This timeout ensures the 'slide-in' class is applied before we remove it to trigger the animation.
        setTimeout(() => {
            newNumberEl.classList.remove('slide-in');
        }, 20);

        oldNumberEl.addEventListener('transitionend', () => {
            oldNumberEl.remove();
        }, { once: true });
    }

    // --- Helper Functions ---
    const formatTime = (time) => String(time).padStart(2, '0');
    const showError = (el, text) => { el.textContent = text; el.classList.add('show'); };
    const hideError = (el) => { el.classList.remove('show'); el.textContent = ''; };
    const playCompletionSound = () => {
        try {
            // Using a reliable, high-quality sound for completion
            const audio = new Audio('sounds/top.mp3');
            audio.play().catch(e => console.error("Could not play sound:", e));
        } catch (e) {
            console.error("Error creating audio object:", e);
        }
    };

    // --- Initial State ---
    addNewTimer();
});
