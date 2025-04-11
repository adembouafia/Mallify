document.addEventListener("DOMContentLoaded", function () {
    const slider = document.getElementById("slider-range");
    const thumb1 = document.createElement("div");
    const thumb2 = document.createElement("div");
    const track = document.createElement("div");
  
    thumb1.className = "slider-thumb";
    thumb2.className = "slider-thumb";
    track.className = "slider-track";
  
    slider.appendChild(track);
    slider.appendChild(thumb1);
    slider.appendChild(thumb2);
  
    const amount = document.getElementById("amount");
  
    // Config
    const min = 0;
    const max = 1000;
    const step = 1; // This is your step value ($1 increments)
    let val1 = 200;
    let val2 = 800;
  
    const updateUI = () => {
      const range = max - min;
      const percent1 = ((val1 - min) / range) * 100;
      const percent2 = ((val2 - min) / range) * 100;
  
      thumb1.style.left = `calc(${percent1}% - 8px)`;
      thumb2.style.left = `calc(${percent2}% - 8px)`;
      track.style.left = `${percent1}%`;
      track.style.width = `${percent2 - percent1}%`;
  
      amount.value = `$${val1} - $${val2}`;
    };
  
    const bindDrag = (thumb, isFirst) => {
      const onMouseMove = (e) => {
        const rect = slider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.min(1, Math.max(0, x / rect.width));
  
        // Fixing this line to ensure a jump of $1 per drag
        let rawValue = min + percent * (max - min);
        let steppedValue = Math.round(rawValue); // Now the value is directly rounded to $1 increments
  
        // Enforcing the correct bounds and $1 steps
        if (isFirst) {
          val1 = Math.min(steppedValue, val2 - step);
        } else {
          val2 = Math.max(steppedValue, val1 + step);
        }
  
        updateUI();
      };
  
      const onMouseUp = () => {
        thumb.classList.remove("active");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
  
      thumb.addEventListener("mousedown", () => {
        thumb.classList.add("active");
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    };
  
    bindDrag(thumb1, true);
    bindDrag(thumb2, false);
    updateUI();
  });
  