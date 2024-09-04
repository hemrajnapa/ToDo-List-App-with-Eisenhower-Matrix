document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById('new-task');
    const taskCategory = document.getElementById('task-category');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const addTaskButton = document.getElementById('add-task');
    const quadrants = document.querySelectorAll('.matrix-quadrant');
    const motivationBar = document.getElementById('motivation-bar');
    let totalTasks = 0; // Initialize total tasks
    let completedTasks = 0; // Initialize completed tasks
    const tasks = {}; // Object to store tasks by date and unique IDs

    // Handle Add Task button click
    addTaskButton.addEventListener('click', () => {
        const task = taskInput.value.trim();
        const selectedCategory = taskCategory.value || 'not-urgent-not-important';
        const date = taskDate.value;
        const time = taskTime.value;

        if (task) {
            const taskKey = date && time ? `${date}-${time}` : `${new Date().toISOString()}`; // Use current date and time if not provided
            if (!tasks[taskKey]) {
                tasks[taskKey] = [];
            }
            const taskObject = { task, category: selectedCategory, completed: false, id: generateTaskId() };
            tasks[taskKey].push(taskObject);
            totalTasks++; // Increase total tasks count
            addTaskToQuadrant(taskObject, taskKey, date, time);
            updateMotivationBar(); // Update motivation bar based on the new total

            // Clear input fields
            taskInput.value = '';
            taskDate.value = '';
            taskTime.value = '';
        } else {
            alert('Please enter a task.');
        }
    });

    // Add task to the specified quadrant
    const addTaskToQuadrant = (taskObject, taskKey, date, time) => {
        const taskItem = createTaskElement(taskObject, taskKey, date, time);
        const quadrantId = getQuadrantId(taskObject.category);
        if (quadrantId) {
            document.getElementById(quadrantId).querySelector('.task-list').appendChild(taskItem);
        } else {
            alert('Invalid category.');
        }
    };

    // Create a unique task ID
    const generateTaskId = () => `task-${Math.random().toString(36).substr(2, 9)}`;

    // Create a task element
    const createTaskElement = (taskObject, taskKey, date, time) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.taskId = taskObject.id; // Set a unique identifier

        // Create a span for the task text to separate it from other elements like delete button
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = taskObject.task;

        // Display task with date, time, or both if available
        let datetimeDisplay = '';
        if (date && time) {
            datetimeDisplay = `<span class="task-datetime">(${formatDateTime(date, time)})</span>`;
        } else if (date) {
            datetimeDisplay = `<span class="task-datetime" style="font-size: 0.8em;">(${formatDateOnly(date)})</span>`;
        } else if (time) {
            datetimeDisplay = `<span class="task-datetime" style="font-size: 0.8em;">(${formatTimeOnly(time)})</span>`;
        }

        // Add the datetime display if available
        taskText.insertAdjacentHTML('beforeend', ` ${datetimeDisplay}`);

        // Add checkbox for marking completion
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = taskObject.completed;
        checkbox.addEventListener('change', (event) => {
            // Only toggle the completed class on the task text, not the entire item
            taskText.classList.toggle('completed', event.target.checked);
            updateTaskCompletion(taskKey, taskObject.id, event.target.checked);
        });

        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => {
            deleteTask(taskItem, taskKey, taskObject.id);
        });

        taskItem.prepend(checkbox);
        taskItem.appendChild(taskText);
        taskItem.appendChild(deleteButton);
        taskItem.draggable = true;
        taskItem.addEventListener('dragstart', dragStart);

        return taskItem;
    };

    // Format date and time together
    const formatDateTime = (date, time) => {
        const dateObj = new Date(`${date}T${time}`);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dateObj.toLocaleString('en-US', options);
    };

    // Format date only
    const formatDateOnly = (date) => {
        const dateObj = new Date(date);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    };

    // Format time only
    const formatTimeOnly = (time) => {
        const timeObj = new Date(`1970-01-01T${time}`);
        const options = { hour: '2-digit', minute: '2-digit' };
        return timeObj.toLocaleTimeString('en-US', options);
    };

    // Update task completion status
    const updateTaskCompletion = (taskKey, taskId, isChecked) => {
        const taskList = tasks[taskKey];
        if (taskList) {
            const task = taskList.find(t => t.id === taskId);
            if (task) {
                task.completed = isChecked;
                completedTasks += isChecked ? 1 : -1; // Adjust completed tasks count
            }
        }
        updateMotivationBar(); // Update motivation bar based on completion status
    };

    // Delete a task
    const deleteTask = (taskItem, taskKey, taskId) => {
        const taskList = tasks[taskKey];
        if (taskList) {
            // Remove the task from the task list
            tasks[taskKey] = taskList.filter(task => task.id !== taskId);
            // If task was completed, adjust the completed count
            if (taskItem.querySelector('input[type="checkbox"]').checked) {
                completedTasks--;
            }
            // Adjust the total tasks count and update the UI
            totalTasks--;
            taskItem.remove();
            updateMotivationBar(); // Update motivation bar after deletion
        }
    };

    // Update motivation bar based on total and completed tasks
    const updateMotivationBar = () => {
        const percentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
        motivationBar.value = percentage;
    };

    // Get quadrant ID based on category
    const getQuadrantId = (category) => {
        switch (category) {
            case 'urgent-important':
                return 'urgent-important';
            case 'not-urgent-important':
                return 'not-urgent-important';
            case 'urgent-not-important':
                return 'urgent-not-important';
            case 'not-urgent-not-important':
                return 'not-urgent-not-important';
            default:
                return null;
        }
    };

    // Handle drag start event
    const dragStart = (event) => {
        // Store task ID instead of task text to accurately identify the task
        const taskId = event.target.dataset.taskId;
        event.dataTransfer.setData('text/plain', taskId);
        event.target.classList.add('dragging');
    };

    // Handle drag over and drop events
    quadrants.forEach(quadrant => {
        quadrant.addEventListener('dragover', (event) => event.preventDefault());
        quadrant.addEventListener('drop', (event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData('text/plain');
            const draggedTask = document.querySelector(`[data-task-id='${taskId}']`);

            if (draggedTask) {
                const quadrantId = quadrant.id;
                const taskObject = findTaskById(taskId);
                if (taskObject) {
                    taskObject.category = getQuadrantCategory(quadrantId);
                    addTaskToQuadrant(taskObject, taskObject.taskKey, taskObject.date, taskObject.time);
                    draggedTask.remove(); // Remove the dragged task from the previous quadrant
                }
                draggedTask.classList.remove('dragging');
            }
        });
    });

    // Find task by ID across all tasks
    const findTaskById = (taskId) => {
        for (const key in tasks) {
            const taskList = tasks[key];
            for (const task of taskList) {
                if (task.id === taskId) {
                    task.taskKey = key; // Add the key to the task object for reference
                    return task;
                }
            }
        }
        return null;
    };

    // Get quadrant category based on the quadrant ID
        // Get quadrant category based on the quadrant ID
    const getQuadrantCategory = (quadrantId) => {
        switch (quadrantId) {
            case 'urgent-important':
                return 'urgent-important';
            case 'not-urgent-important':
                return 'not-urgent-important';
            case 'urgent-not-important':
                return 'urgent-not-important';
            case 'not-urgent-not-important':
                return 'not-urgent-not-important';
            default:
                return null;
        }
    };

    // Refresh motivation bar when the page loads to ensure correct display
    window.addEventListener('load', updateMotivationBar);
});
