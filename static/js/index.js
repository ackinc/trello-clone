const REGISTRATION_API_URL = '/api/register';
const LOGIN_API_URL = '/api/login';
const RESEND_VERIFICATION_EMAIL_API_URL = '/api/resend_verification_email';
const VERIFY_EMAIL_API_URL = '/api/verify_email';

const main_node = document.querySelector('main');
const all_sections = document.querySelectorAll('.user-action-section');
let cur_section;
showSection('login_section');

// displays the section having id <id>,while hiding other sections
function showSection(id) {
    all_sections.forEach(section => {
        if (section.id === id) {
            section.classList.remove('hide');
            section.querySelector('input').focus();
            cur_section = section;
        } else {
            section.classList.add('hide');
        }
    });
}

document.querySelectorAll('span.change-active-section').forEach(elem => {
    elem.addEventListener('click', function (e) {
        showSection(this.dataset.show);
    });
});

document.querySelector('form[name="registration_form"]').addEventListener('submit', function (e) {
    e.preventDefault();

    this.querySelector('.info').innerHTML = ``;
    this.querySelector('.error').innerHTML = ``;

    const username = this.querySelector('input[name="username"]').value;
    const pass = this.querySelector('input[name="password"]').value;
    const c_pass = this.querySelector('input[name="c_password"]').value;
    if (pass !== c_pass) {
        this.querySelector('.error').innerHTML = `Passwords don't match`;
        return;
    }

    fetch(REGISTRATION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: pass })
    })
        .then(res => res.json())
        .then(body => {
            if (body.error === 'USERNAME_IN_USE') {
                this.querySelector('.error').innerHTML = 'There is already an account with this email address. Please log in, or register with a different email.';
            } else if (body.error) {
                this.querySelector('.error').innerHTML = body.error;
            } else {
                showEmailVerificationSection(username);
            }
        })
        .catch(err => {
            this.querySelector('.error').innerHTML = `Network error.`;
            console.error(err);
        });
});

document.querySelector('form[name="login_form"]').addEventListener('submit', function (e) {
    e.preventDefault();

    this.querySelector('.info').innerHTML = ``;
    this.querySelector('.error').innerHTML = ``;

    const username = this.querySelector('input[name="username"]').value;
    const pass = this.querySelector('input[name="password"]').value;

    tryLogin({ username: username, password: pass });
});

function tryLogin(credentials) {
    fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    })
        .then(res => res.json())
        .then(body => {
            if (body.error) {
                cur_section.querySelector('.error').innerHTML = body.error;
            } else if (body.message === 'VERIFICATION_EMAIL_SENT') {
                showEmailVerificationSection(credentials.username);
            } else {
                document.location.replace('./boards.html');
            }
        })
        .catch(err => {
            cur_section.querySelector('.error').innerHTML = `Network error.`;
        });
}

function showEmailVerificationSection(email) {
    const s = document.querySelector('#email_verification_section');

    s.querySelector('.error').innerHTML = '';
    s.querySelector('.info').innerHTML = 'A verification email has been sent to your inbox. Please enter the verification code and submit the form.';
    s.querySelector('input[name="email"]').value = email;

    showSection(s.id);
}

document.querySelector('form[name="email_verification_form"]').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = this.querySelector('input[name="email"]').value;
    const code = this.querySelector('input[name="code"]').value;

    tryEmailVerification(email, code);
});

function tryEmailVerification(email, code) {
    fetch(VERIFY_EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: code })
    })
        .then(res => res.json())
        .then(body => {
            const [errorbox] = clearErrorAndInfoBoxes();

            if (body.error === 'TOKEN_EXPIRED') {
                errorbox.innerHTML = 'Your code has expired. Please use the "resend verification email" feature below to get another code.';
            } else if (body.error) {
                errorbox.innerHTML = body.error;
            } else {
                document.location.replace('./boards.html');
            }
        })
        .catch(err => {
            errorbox.innerHTML = 'Network error.';
            console.error(err);
        });
}

document.querySelector('#email_verification_section span.resend_verification_email').addEventListener('click', function (e) {
    resendVerificationEmail(cur_section.querySelector('input[name="email"]').value);
});

function resendVerificationEmail(email) {
    const [errorbox, infobox] = clearErrorAndInfoBoxes();

    fetch(`${RESEND_VERIFICATION_EMAIL_API_URL}?email=${email}`)
        .then(res => res.json())
        .then(body => {
            if (body.error) {
                errorbox.innerHTML = body.error;
            } else {
                infobox.innerHTML = 'Email sent. Please check your inbox.';
            }
        })
        .catch(err => {
            errorbox.innerHTML = 'Network error';
            console.error(err);
        });
}

function clearErrorAndInfoBoxes() {
    const errorbox = cur_section.querySelector('.error');
    const infobox = cur_section.querySelector('.info');
    errorbox.innerHTML = '';
    infobox.innerHTML = '';
    return [errorbox, infobox];
}
