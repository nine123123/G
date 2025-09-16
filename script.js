/*
 * Common JavaScript for Graninfluencer static site.
 * Provides accessibility controls: font size adjustment, high contrast toggle, text-to-speech.
 * Also loads course data for index and courses pages and displays modals for details.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Font size from localStorage
  const fontRange = document.getElementById('fontRange');
  const storedSize = localStorage.getItem('fontSize') || '100';
  // set initial font size on document root
  document.documentElement.style.fontSize = 16 * (parseInt(storedSize) / 100) + 'px';
  if (fontRange) {
    fontRange.value = storedSize;
    fontRange.addEventListener('input', (e) => {
      const val = e.target.value;
      document.documentElement.style.fontSize = 16 * (val / 100) + 'px';
      localStorage.setItem('fontSize', val);
    });
  }

  // High contrast toggle from localStorage
  const hcBtn = document.getElementById('hcBtn');
  const hcStored = localStorage.getItem('highContrast') === 'true';
  if (hcStored) {
    document.body.classList.add('hc');
    if (hcBtn) {
      hcBtn.setAttribute('aria-pressed', 'true');
    }
  }
  if (hcBtn) {
    hcBtn.addEventListener('click', () => {
      document.body.classList.toggle('hc');
      const on = document.body.classList.contains('hc');
      hcBtn.setAttribute('aria-pressed', on);
      localStorage.setItem('highContrast', on);
    });
  }

  // Text-to-speech
  const ttsBtn = document.getElementById('ttsBtn');
  let speaking = false;
  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) {
        alert('เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง');
        return;
      }
      const synth = window.speechSynthesis;
      if (speaking) {
        synth.cancel();
        speaking = false;
        ttsBtn.textContent = 'อ่านหน้านี้';
        ttsBtn.setAttribute('aria-pressed', 'false');
        return;
      }
      // gather headings for narration
      const headings = Array.from(document.querySelectorAll('h1, h2'))
        .map((h) => h.innerText.trim())
        .filter((text) => text.length > 0);
      if (headings.length === 0) {
        return;
      }
      const utter = new SpeechSynthesisUtterance(headings.join('. '));
      utter.lang = 'th-TH';
      utter.rate = 0.95;
      utter.onend = () => {
        speaking = false;
        ttsBtn.textContent = 'อ่านหน้านี้';
        ttsBtn.setAttribute('aria-pressed', 'false');
      };
      synth.cancel();
      synth.speak(utter);
      speaking = true;
      ttsBtn.textContent = 'หยุดการอ่าน';
      ttsBtn.setAttribute('aria-pressed', 'true');
    });
  }

  // Load highlight courses on index page
  if (document.getElementById('highlightCourses')) {
    fetch('data/courses.json')
      .then((res) => res.json())
      .then((data) => {
        const container = document.getElementById('highlightCourses');
        const limited = data.slice(0, 3);
        limited.forEach((c) => {
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML = `<h3>${c.title}</h3><p>${c.summary}</p><p><strong>เวลาเรียน:</strong> ${c.duration}</p>`;
          container.appendChild(div);
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // Courses page list
  if (document.getElementById('coursesList')) {
    fetch('data/courses.json')
      .then((res) => res.json())
      .then((data) => {
        const container = document.getElementById('coursesList');
        data.forEach((c, idx) => {
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML = `<h3>${c.title}</h3><p>${c.summary}</p><p><strong>เวลาเรียน:</strong> ${c.duration}</p><button class="btn-detail" data-index="${idx}">ดูรายละเอียด</button>`;
          container.appendChild(div);
        });
      })
      .catch((err) => {
        console.error(err);
      });

    // Event delegation for course details buttons
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('btn-detail')) {
        const idx = parseInt(e.target.dataset.index, 10);
        fetch('data/courses.json')
          .then((r) => r.json())
          .then((data) => {
            const course = data[idx];
            const modal = document.getElementById('courseModal');
            if (!modal) return;
            const titleEl = modal.querySelector('.modal-title');
            const bodyEl = modal.querySelector('.modal-body');
            titleEl.textContent = course.title;
            // If description exists, display it; otherwise show summary
            bodyEl.innerHTML = `<p>${course.summary}</p>`;
            if (course.description) {
              bodyEl.innerHTML += `<p>${course.description}</p>`;
            }
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            modal.querySelector('.modal-close').focus();
          })
          .catch((err) => console.error(err));
      }
    });

    // Close modal when clicking overlay or close button
    document.addEventListener('click', (e) => {
      if (e.target && (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay'))) {
        const modal = document.getElementById('courseModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
});