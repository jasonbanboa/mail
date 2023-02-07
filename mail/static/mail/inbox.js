
// eventlistener for toggling views
document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));

  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));

  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));

  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // on submitting the form (email) 
  document.querySelector('#compose-form').addEventListener('submit', submit_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

// functinality to go back or forward in history
window.onpopstate = function(event) {
  resetClasses();
  if (event.state.view === 'compose') {
    compose_email();
  } else {
    load_mailbox(event.state.view);
  }
}

// eventlistener for updating url
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.navibutton').forEach(button => {
    button.onclick = function() {
      // data set for view 
      const view = this.dataset.view;
      // console.log(view);
      // update the view to the url
      history.pushState({view: view}, "", `${view}`)
    }
  });
});

// reset classes nav buttons to remove styles
function resetClasses() {
  document.getElementById('inbox').className = 'navibutton';
  document.getElementById('sent').className = 'navibutton';
  document.getElementById('archive').className = 'navibutton';
  document.getElementById('compose').className = 'navibutton'; 
}


function submit_email(event) {

  // removes all error alerts on submit to prevent crowding 
  document.querySelectorAll('.del-after').forEach((elm) => {
    elm.remove();
  });

  // prevents the browser from refreshing 
  event.preventDefault();

  // Post email to API route
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    })
  })
    .catch(error => {
        console.log('Errors:', error);
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);

      // if there is an error make a div for an error else load send mailbox
      if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger del-after';
        
        errorDiv.innerHTML = result.error;
        document.querySelector('#form-error').append(errorDiv);

        // displays a div temp on the dom
        setTimeout(() => {
          const alert = document.querySelector('.del-after');
          
          // start "remove" animation after 5 seconds
          alert.style.animationPlayState = 'running';

          // once "remove" animation is finished remove the element
          alert.addEventListener('animationend', () => {
            alert.remove();
          });
        }, 5000); // time in miliseconds

      } else {
        load_mailbox('sent');
      }
    });
}


function compose_email() {
  resetClasses();
  document.querySelector('#compose').className = 'navibutton navibutton-focus';

  // Show compose view and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}


function load_mailbox(mailbox) {
  
  // reset nav button classes to toggle view
  resetClasses();

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
    
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  document.querySelector(`#${mailbox}`).className = 'navibutton navibutton-focus';

  // get aproporiate json data 
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails
      console.log(emails);

      const emailsView = document.querySelector('#emails-view');
      // check if inbox is empty
      if (emails.length === 0) {
        
        const empty = document.createElement('div');
        empty.innerHTML = `<p>Your ${mailbox} section is currently Empty</p>`;
        empty.className = 'alert-empty';

        emailsView.append(empty);
      } else {

        emails.forEach(email => {

          // creates a div with contents of email nested in p tag
          const emailDiv = document.createElement('div');
  
          if (email.read) {
            emailDiv.className = 'indi-email read';
          } else {
            emailDiv.className = 'indi-email unread';
          }
  
          emailDiv.innerHTML = `<div>From: ${email.sender}</div> <div>Subject: ${email.subject}</div> <div>${email.body}</div> <div>${email.timestamp}</div>`;
  
          // add on click 
          emailDiv.addEventListener('click', () => {
            loadEmail(email.id);
          })
  
          // appends the created element to emails-view
          emailsView.append(emailDiv);
        });
      }
    });
}


// gets the email id and sends a request to get json 
function loadEmail(id) {
  fetch(`/emails/${parseInt(id)}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);


      // hides all the views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block';

      // checks for previous email and removes all from view
      document.querySelectorAll('.email-container').forEach((email) => {
        email.remove();
      });

      // make email view
      const emailView = document.createElement('div');
      emailView.className = 'email-container';
      emailView.innerHTML = `<div><h3>${email.subject}</h3> <br> </div> <div><Strong>From </strong>&#60;${email.sender}&#62; </div> <div><strong>To </strong> &#60;${email.recipients}&#62;</div> <br><br> <div><pre style="white-space: pre;">${email.body}</pre></div> <br>`
      document.querySelector('#email-view').append(emailView);
      fetch(`/emails/${parseInt(id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })

      // make reply button for reply functionality
      const reply = document.createElement('button');
      reply.className = 'btn btn-sm btn-outline-dark reply';      
      reply.innerHTML = 'Reply';
      reply.addEventListener('click', () => {

        // call compose_email to make compose view visable
        compose_email();

        // set input values appropirate
        document.getElementById('compose-recipients').value = email.sender;
        document.getElementById('compose-recipients').disabled = true;

        // if subject already has "Re: " dont include otherwise include
        if (email.subject.includes('Re: ')) {
          document.getElementById('compose-subject').value = email.subject;
        } else {
          document.getElementById('compose-subject').value = `Re: ${email.subject}`;
        }
        
        document.getElementById('compose-body').value = ` >> On ${email.timestamp} ${email.sender} wrote: ${email.body} `;
    
      });

      // append the button
      document.querySelector('.email-container').append(reply);

      // makeing userEmail variable for ARCHIVE FUNTIONALITY
      const userEmail = document.getElementById('user-email').innerHTML;

      /* 
        check if user email is equal to email senders 
        if user email and email sender is equal ignore 
        else make the buttton
      */
      if (userEmail != email.sender) {

        // make a button for archiving and unarchiving an email
        const archiveButton = document.createElement('button');

        //  if email is already archived 
        if (email.archived) {

          archiveButton.className = 'btn btn-sm btn-outline-dark archive';
          archiveButton.innerHTML = 'Unarchive';
          archiveButton.addEventListener('click', () => {
            fetch(`/emails/${parseInt(id)}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: false
              })
            }).then(() => {
              load_mailbox('inbox');
            });
          });

          // else make a button with different class, inner html and request 
        } else {

          archiveButton.className = 'btn btn-sm btn-outline-dark archive';
          archiveButton.innerHTML = 'Archive';
          archiveButton.addEventListener('click', () => {
            fetch(`/emails/${parseInt(id)}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            }).then(() => {
              load_mailbox('inbox');
            });
          });
        }
        // finally append the button to the container
        document.querySelector('.email-container').append(archiveButton);
      }
    });
}

