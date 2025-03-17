document.addEventListener("DOMContentLoaded", () => {
    const redButton = document.querySelector(".color-btn.red-btn");
    const redOptions = document.getElementById("red-options");
    const allColorButtons = document.querySelectorAll(".color-btn");
    let calendarData = {};

    // Set color styles for headers
    ["project-name", "house-info", "check-round", "appointment-date"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.color = '#276d98';
    });

    // Toggle visibility function
    const toggleDisplay = (element, condition) => {
        element.style.display = condition ? "block" : "none";
    };

    // Toggle red options on Red button click
    redButton.addEventListener("click", () => {
        toggleDisplay(redOptions, redOptions.style.display !== "block");
    });

    // Handle color button clicks
    allColorButtons.forEach(button => {
        button.addEventListener("click", () => {
            allColorButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            if (button.classList.contains("red-btn")) {
                toggleDisplay(redOptions, redOptions.style.display !== "block");
            } else {
                toggleDisplay(redOptions, false);
            }

            console.log(`Selected color: ${button.textContent.trim()}`);
        });
    });

    // Handle Red option selection
    document.querySelectorAll("#red-options input[name='red_level']").forEach(option => {
        option.addEventListener("change", (event) => {
            redButton.textContent = `Red Level ${event.target.value}`;
            toggleDisplay(redOptions, false);
            console.log(`Selected Red Level: ${event.target.value}`);
        });
    });

    // Initialize LIFF and fetch user data
    liff.init({ liffId: "2006773751-Jo3NAEby" })
        .then(() => {
            if (!liff.isLoggedIn()) {
                liff.login();
            }
            return liff.getProfile();
        })
        .then(profile => {
            const userId = profile.userId;

            const urlParams = new URLSearchParams(window.location.search);
            calendarData = {
                houseNumber: urlParams.get('houseNumber'),
                projectName: urlParams.get('projectName'),
                checkRound: urlParams.get('checkRound'),
                appointmentDate: urlParams.get('appointmentDate'),
                email: urlParams.get('email') || document.getElementById('email').value || '',
                inspector: urlParams.get('inspector') || document.getElementById('inspector').value || '',
                userId,
            };

            // Display calendar data in the info section
            document.getElementById('project-name').innerText = ` ${calendarData.projectName}`;
            // หลังจากดึงข้อมูลจาก calendar มาแล้ว ให้แสดง houseNumber จาก calendarData
            document.getElementById('house-info').innerHTML = `
            <img src="https://i.ibb.co/fddtyjz/Home-3.png" alt="House Icon" class="icon">
            บ้านเลขที่: ${calendarData.houseNumber || ''}
        `;
            document.getElementById('check-round').innerHTML = `
            <img src="https://i.ibb.co/C514R18/List-Numbers.png" alt="Check Round Icon" class="icon">
            ตรวจรอบที่: ${calendarData.checkRound}
        `;
            document.getElementById('appointment-date').innerHTML = `
            <img src="https://i.ibb.co/qLHQ6dJ/icon.png" alt="Calendar Icon" class="icon">
            วันที่นัด: ${calendarData.appointmentDate}
        `;
        })
        .catch(err => console.error("Error fetching userId or calendar data:", err));

    // Handle form submission
    document.getElementById('inspection-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const getDynamicValues = sectionId => {
            return Array.from(document.querySelectorAll(`#${sectionId}-fields .dynamic-input`))
                .map(input => input.value.trim())
                .filter(value => value !== "")
                .join(", ");
        };

        const formData = {
            ...calendarData, // Include calendar data
            sanitation: getDynamicValues('sanitation'),
            leakage: getDynamicValues('leakage'),
            roof: getDynamicValues('roof'),
            electricity: getDynamicValues('electricity'),
            architecture: getDynamicValues('architecture'),
            notes: document.getElementById('notes').value.trim(),
            email: document.getElementById('email').value.trim(),
            inspector: document.getElementById('inspector').value.trim(),
            actionButton: document.querySelector('input[name="actionButton"]:checked')?.value || "",
            redButtonLevel: document.querySelector('input[name="red_level"]:checked')?.value || "",  // Ensure this value is correctly passed
            selectedColor: document.querySelector("input[name='color']:checked")?.value || "",  // Ensure this value is correctly passed
        };

        // Send form data to server to be saved in the database
        fetch('/save-data', {  // Adjust the URL if needed
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('ข้อมูลบันทึกสำเร็จและส่งไปยัง LINE แล้ว');
                liff.closeWindow(); // Close LIFF window after successful save
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        })
        .catch(err => {
            console.error('Error sending data:', err);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
        });

        console.log('Form data being sent:', formData);
    });

    // Handle dynamic field addition
    document.querySelectorAll(".add-field").forEach(button => {
        button.addEventListener("click", (event) => {
            const sectionId = button.dataset.section;
            const sectionContainer = document.getElementById(`${sectionId}-fields`);
            if (!sectionContainer) return;

            const fieldContainer = document.createElement("div");
            fieldContainer.classList.add("field-container");

            const newField = document.createElement("input");
            newField.type = "text";
            newField.placeholder = "กรอกข้อมูล";
            newField.classList.add("dynamic-input");

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "ลบ";
            deleteButton.classList.add("delete-btn");
            deleteButton.addEventListener("click", () => {
                sectionContainer.removeChild(fieldContainer);
            });

            fieldContainer.appendChild(newField);
            fieldContainer.appendChild(deleteButton);
            sectionContainer.appendChild(fieldContainer);
        });
    });

    // Handle action buttons ("เข้าหน้างาน", "ไม่ได้เข้าหน้างาน", "มีตัวแทนลูกค้า")
    document.querySelectorAll(".status-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".status-btn").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const inputId = button.getAttribute("for");
            const input = document.getElementById(inputId);
            if (input) {
                input.checked = true;
                console.log(`Selected action: ${input.value}`);
            }
        });
    });
});
