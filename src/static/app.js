document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Additional activities to ensure there are at least:
  // 2 sports, 2 artistic, 2 intellectual activities
  const additionalActivities = {
    "Basketball Club": {
      description: "Weekly pick-up games and skills practice for all levels.",
      schedule: "Tue & Thu 4:00pm - 6:00pm",
      max_participants: 20,
      participants: ["alex@mergington.edu", "jamie@mergington.edu"]
    },
    "Swimming Squad": {
      description: "Lap swimming, technique drills and timed sets.",
      schedule: "Mon, Wed & Fri 6:00am - 7:30am",
      max_participants: 15,
      participants: ["taylor@mergington.edu"]
    },
    "Ceramics Workshop": {
      description: "Hand-building and wheel-throwing; kiln firings included.",
      schedule: "Wed 3:30pm - 5:30pm",
      max_participants: 12,
      participants: []
    },
    "Choir Ensemble": {
      description: "Mixed-voice choir rehearsals and performance opportunities.",
      schedule: "Thu 5:00pm - 6:30pm",
      max_participants: 30,
      participants: ["sam@mergington.edu", "lee@mergington.edu", "aria@mergington.edu"]
    },
    "Debate Team": {
      description: "Practice rounds, argumentation workshops, and tournaments.",
      schedule: "Tue 5:00pm - 7:00pm",
      max_participants: 18,
      participants: ["morgan@mergington.edu"]
    },
    "Robotics Club": {
      description: "Build and program robots for local and regional challenges.",
      schedule: "Fri 4:00pm - 6:30pm",
      max_participants: 16,
      participants: ["kai@mergington.edu", "riley@mergington.edu"]
    }
  };

  // Function to remove a participant from an activity
  async function removeParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh the activities list
        fetchActivities();
      } else {
        const result = await response.json();
        console.error("Error removing participant:", result.detail);
      }
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const serverActivities = await response.json();

      // Merge additional activities without overwriting server-defined ones
      const activities = { ...additionalActivities, ...serverActivities };
      Object.entries(serverActivities).forEach(([name, _]) => {
        // If server has an activity with same name, prefer server version
        activities[name] = serverActivities[name];
      });

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants list (pretty)
        const participantsHeading = document.createElement("p");
        participantsHeading.innerHTML = "<strong>Participants:</strong>";
        participantsHeading.className = "participants-heading";
        activityCard.appendChild(participantsHeading);

        const participantsListEl = document.createElement("ul");
        participantsListEl.className = "participants-list";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            const emailSpan = document.createElement("span");
            emailSpan.textContent = p;
            li.appendChild(emailSpan);
            
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant-btn";
            deleteBtn.innerHTML = "✕";
            deleteBtn.type = "button";
            deleteBtn.onclick = async (e) => {
              e.preventDefault();
              await removeParticipant(name, p);
            };
            li.appendChild(deleteBtn);
            
            participantsListEl.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "muted";
          participantsListEl.appendChild(li);
        }

        activityCard.appendChild(participantsListEl);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
