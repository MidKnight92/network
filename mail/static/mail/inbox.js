document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.getElementById('submit').addEventListener('click', () => 
  sent_email());

  // By default, load the inbox
  load_mailbox('inbox');
});


async function get_emails(mailbox){
  try {
    await fetch(`emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {
      
      // Show fetched messages
      if (result.length !== 0){
          result.forEach(email => {
          
          // Create div element
          const element = document.createElement('div');

          // element.className = "email"
          element.id= email["id"];

          // Inbox renders button to archive unarchived emails, Archive renders button to unarchive archived emails, otherwise no button is rendered
          if (mailbox === 'inbox'){
            if (!email["archived"] && !email["read"]){
              element.innerHTML = `<b>Sender:</b> ${email['sender']} <br/><b>Subject:</b>${email['subject']} <br/> <b>Message:</b> ${email['body']} <br/><b>Time:</b> ${email['timestamp']}<hr><button type="button" class="btn btn-sm btn-primary" data-id="${email['id']}" data-action="archive">Archive</button><button style="margin-left: 2%" type="button" class="btn btn-sm btn-success" data-id="${email['id']}" data-action="read">Read</button>`;
            } 
            if (!email["archived"] && email["read"]){
              element.innerHTML = `<b>Sender:</b> ${email['sender']} <br/><b>Subject:</b>${email['subject']} <br/> <b>Message:</b> ${email['body']} <br/><b>Time:</b> ${email['timestamp']}<hr><button type="button" class="btn btn-sm btn-primary" data-id="${email['id']}" data-action="archive">Archive</button>`
            }
          } 
          if (mailbox === 'archive'){
            element.innerHTML = `<b>Sender:</b> ${email['sender']} <br/><b>Subject:</b>${email['subject']} <br/> <b>Message:</b> ${email['body']} <br/><b>Time:</b> ${email['timestamp']}<hr><button data-id="${email['id']}" type="button" class="btn btn-sm btn-primary" data-action="unarchive">Unarchive</button>`;
          } 
          if (mailbox === 'sent'){
            let recipients = email['recipients'];
            if (recipients.length > 1) {
              recipients = recipients.map(recipient => `<span style="margin-left: .5%">${recipient}</span>`);
            }
            element.innerHTML = `<b>Recipients:</b> ${recipients} <br/><b>Subject:</b>${email['subject']} <br/> <b>Message:</b> ${email['body']} <br/><b>Time:</b> ${email['timestamp']}`;
          }

          // Display unread emails with white background and read emails with a gray background
          if (email["read"]){
            element.style = "color: white; border: solid 2px dodgerBlue; background-color: gray; padding: 1%; margin-bottom: 4%;";
          } else {
            element.style = "border: solid 2px dodgerBlue; background-color: white; padding: 1%; margin-bottom: 4%;";
          }
          document.querySelector('#emails-view').append(element)
        });

        // Add event listener to the buttons in the inbox to archive email
        if (mailbox === 'inbox'){
          document.querySelectorAll('button[data-action="archive"]').forEach((button) => {
            button.onclick = ()=> {
              
              // Pass the email's id as an argument
              archive_email(button.dataset.id)
            }
          });

          //Add event listener to the buttons in the inbox to view email
          document.querySelectorAll('button[data-action="read"]').forEach((button) => {
            button.onclick = () => {
              
              // Pass the email's id as an argument
              view_email(button.dataset.id);
            }
          });
        }

        // Add event listener to the buttons in archive to unarchive email
        if (mailbox === 'archive'){  
          document.querySelectorAll('button[data-action="unarchive"]').forEach((button) => {
            button.onclick = ()=> {
              
              // Pass the email's id as an argument
              unarchive_email(button.dataset.id)
            }
          });
        }

      // No messages to fetch relay that to user  
      } else {
        const div = document.createElement('div');
        div.innerHTML = `<p>No messages</p>`
        document.querySelector('#emails-view').append(div)
      }
    });

  } catch (error) {
    // Create an error message and append it to the emails-view
    const div = document.createElement('div');
    div.innerHTML = `<p>Sorry there was an error</p>`
    document.querySelector('#emails-view').append(div)

    // Add history to the browser
    window.history.pushState({}, "",`/`);
  }
}

async function sent_email(){
  try {
    await fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then (response => response.json())
    .then(result => {
      
      // Error send user back to the compose email section
      if (result["message"]){

        // Update url
        window.history.pushState({}, '', '/');

        // Load user's sent mailbox
        load_mailbox('sent');
     
       
      } else {

        // Create an error message and append it to the emails-view
        const pTag = document.querySelector("p");
        document.querySelector('h3').innerText = "Error";
        if (pTag.textContent === "No messages"){
            pTag.innerText = `Error: ${result["error"]}`
        }

        // Show emails view with message and hide other views
        document.querySelector('#emails-view').style.display = 'block';
        document.querySelector('#compose-view').style.display = 'none';
        window.history.pushState({}, '', '/')
        return false;
          }
    });

  } catch (error) {

    // Create an error message and append it to the emails-view
    const div = document.createElement('div');
    div.innerHTML = `<p>Error Occured/p>`
    document.querySelector('#emails-view').append(div)

    // Show emails view with message and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

  }
   // Stop the form from submitting
   return false;
}

async function view_email(id){

  try {
    let messageInfo = '';
    await fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email =>{

      messageInfo = email;
      // Show the name
      document.querySelector('#email-view').innerHTML = `<div><b>Sender:</b>${email['sender']}<br/><b>Subject:</b>${email['subject']}<br/><b>Time:</b> ${email['timestamp']}<br/><button type="button" class="btn btn-sm btn-primary" data-action="reply">Reply</button><hr><b>Message:</b> ${email['body']}</div>`;
    });

    // Show email view with message and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Call function to update that email has been read
    read_email(id);

    // Add event listener to the reply button 
    const button = document.querySelector('button[data-action="reply"]')
    button.onclick = () => {

      reply_email(messageInfo)
    }

  } catch (error) {
    console.log(error);
  }
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add history to the browser
  window.history.pushState({}, "",`/`);
  
}

async function read_email(id){
  try {
    await fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });
  } catch (error) {
    console.log(error);
  }
}

async function archive_email(id){
  try {
    await fetch(`/emails/${id}`,{
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    });

    load_mailbox('inbox');
  } catch (error) {
    console.log(error);
  }
}

async function unarchive_email(id){
  try {
    await fetch(`/emails/${id}`,{
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    });

    load_mailbox('inbox');
  } catch (error) {
    console.log(error);
  }
}

function reply_email(message){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Add sender as recipient in composition fields
  document.querySelector('#compose-recipients').value = `${message['sender']}`;

  // Trim white space of the subject 
  let subject = message['subject'].trim()

  // Check if the subject starts with "Re:", if not add it
  if (subject.slice(0,4) != "Re: "){

    // Add subject as subject in composition fields
    document.querySelector('#compose-subject').value = `Re: ${subject}`;

  } else {

    // Add subject as subject in composition fields
    document.querySelector('#compose-subject').value = `${subject}`;
  }
  
  // Add body as body in composition fields
  document.querySelector('#compose-body').value = `On ${message["timestamp"]} ${message["sender"]} wrote:\n ${message['body']}\n`;

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Add history to the browser
  window.history.pushState({}, "",`/`);

  get_emails(mailbox);
  
}
