const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || name.length < 2) {
      showToast('Please enter your name.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email.', 'error');
      return;
    }

    if (!subject || subject.length < 5) {
      showToast('Please enter a clear subject.', 'error');
      return;
    }

    if (!message || message.length < 10) {
      showToast('Please provide more details in your message.', 'error');
      return;
    }

    try {
      const response = await fetch(API.CONTACT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to send message.');
      }

      showToast(data.message || 'Message sent successfully!', 'success');
      contactForm.reset();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unable to send your message at this time.', 'error');
    }
  });
}
