/* Custom Modal System */

const Modal = {
    overlay: null,

    init() {
        if (this.overlay) return;

        // Create modal HTML structure
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-header" id="modalHeader"></div>
                <div class="modal-body" id="modalBody"></div>
                <div class="modal-buttons" id="modalButtons"></div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    },

    show() {
        this.init();
        this.overlay.classList.add('active');
    },

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    },

    alert(message, title = 'Notice') {
        return new Promise((resolve) => {
            this.init();

            document.getElementById('modalHeader').innerText = title;
            document.getElementById('modalBody').innerText = message;

            const buttonsDiv = document.getElementById('modalButtons');
            buttonsDiv.innerHTML = `
                <button class="modal-btn modal-btn-primary" id="modalOkBtn">OK</button>
            `;

            const okBtn = document.getElementById('modalOkBtn');
            okBtn.onclick = () => {
                this.close();
                resolve();
            };

            this.show();
        });
    },

    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.init();

            document.getElementById('modalHeader').innerText = title;
            document.getElementById('modalBody').innerText = message;

            const buttonsDiv = document.getElementById('modalButtons');
            buttonsDiv.innerHTML = `
                <button class="modal-btn modal-btn-secondary" id="modalCancelBtn">Cancel</button>
                <button class="modal-btn modal-btn-primary" id="modalConfirmBtn">Confirm</button>
            `;

            document.getElementById('modalCancelBtn').onclick = () => {
                this.close();
                resolve(false);
            };

            document.getElementById('modalConfirmBtn').onclick = () => {
                this.close();
                resolve(true);
            };

            this.show();
        });
    },

    prompt(message, defaultValue = '', title = 'Input Required', inputType = 'text') {
        return new Promise((resolve) => {
            this.init();

            document.getElementById('modalHeader').innerText = title;
            document.getElementById('modalBody').innerHTML = `
                <p style="margin-bottom: 1rem;">${message}</p>
                <input type="${inputType}" class="modal-input" id="modalInput" value="${defaultValue}" autofocus>
            `;

            const buttonsDiv = document.getElementById('modalButtons');
            buttonsDiv.innerHTML = `
                <button class="modal-btn modal-btn-secondary" id="modalCancelBtn">Cancel</button>
                <button class="modal-btn modal-btn-primary" id="modalSubmitBtn">Submit</button>
            `;

            const input = document.getElementById('modalInput');

            const submit = () => {
                const value = input.value;
                this.close();
                resolve(value || null);
            };

            document.getElementById('modalCancelBtn').onclick = () => {
                this.close();
                resolve(null);
            };

            document.getElementById('modalSubmitBtn').onclick = submit;

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submit();
            });

            this.show();

            // Focus input after a short delay to ensure it's rendered
            setTimeout(() => input.focus(), 100);
        });
    }
};

// Make it globally available
window.Modal = Modal;
