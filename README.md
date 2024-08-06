# Connecting Soulmate

## Project Title:
Connecting Soulmate

## Project Description:
Connecting Soulmate is a comprehensive matchmaking website designed to facilitate seamless registration, profile management, and user interactions, with advanced features to ensure a user-friendly and secure experience.

## Key Features:

### User Registration:
- **Multi-Page Registration:** Users can fill out information across six pages.
- **Save Progress:** Users' progress is saved at each step, allowing them to continue from where they left off if they leave and return later.
- **Partner Preferences:** Matches are shown based on partner preferences specified in the sixth form.

### User Interaction:
- **Shortlist, Ban, and Requests:** Users can shortlist, ban, and send two kinds of requests (profile and interest).
- **Inbox Management:** Profile requests allow users to view details except phone numbers and emails. Interest requests enable chatting and viewing all details.
- **Notifications:** Users receive notifications for interest sent, interest accepted, and bans.
- **Unblocking:** Banned users can be unblocked, making them visible again to the user.

### Chat Functionality:
- **Real-time Chat:** Implemented using socket.io with reconnection and Redux middleware for frontend socket setup.
- **Features:** Includes latest message display, auto-scrolling to the last message, message editing, deleting, and seen/unseen status.
- **Reporting:** Users can report offenders. Verified reports result in permanent bans for the reported user.

### Admin Side:
- **User Management:** Admins can view a list of registering users. Approved users can access the website, rejected users can re-register after 15 days, and deleted users' data is soft-deleted for easy reapproval without re-filling all six pages.
- **Notifications:** Admins receive notifications for user actions like sending, accepting, and initiating chats, as well as user reports.
- **Dynamic Currency Rates:** Admins can dynamically update currency rates, ensuring they are always up-to-date.

## Benefits:

### Enhanced User Experience:
- Multi-page registration and save progress features make it easy for users to complete their profiles at their own pace.
- Partner preferences ensure relevant matches, improving user satisfaction.

### Streamlined User Interactions:
- The ability to shortlist, ban, and send requests, along with comprehensive inbox management, facilitates smooth user interactions.
- Real-time chat with advanced features enhances communication between users.

### Robust Admin Controls:
- Admins have comprehensive tools to manage user registrations, approvals, and rejections efficiently.
- Dynamic currency rate updates keep the platform financially relevant and accurate.

### Security and Accountability:
- Reporting features and strict actions against offenders maintain a safe and respectful community environment.
- Notifications keep users and admins informed about important actions, enhancing transparency and responsiveness.

# Deployment

To deploy this project and run on AWS with free SSL

## Installation Intruction

Deployment Instructions for EC2 Instance Setup

## Create an EC2 Instance:

After successfully creating an EC2 instance, navigate to the AWS Management Console.
Click on the Instances section and find your newly created instance.

#### Instance Summary:
Click on the `Instance ID` to access the instance summary.
##### Connect to Instance:

On the instance summary page, locate the Connect button.
#### `CloudShell` Access for Windows Users:

Click `Connect` to access the "Connect to Instance" page.
On the new page, click on the `Connect` button located at the bottom.
##### `CloudShell` Access:

You will be redirected to the `CloudShell` of your EC2 instance.
## Deployment Commands:

Follow the commands below in `CloudShell` for a successful deployment:
Install node version manager (nvm) by typing the following at the command line.
```bash
    #to become a root user
    sudo su -
    # don't need to be a root user, can continue without this
```
```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```
#### Activate nvm by typing the following at the command line.
```bash
    . ~/.nvm/nvm.sh
```
Use nvm to install the latest version of Node.js by typing the following at the command line.
```bash
  nvm install node
```

### Now After Installing Node Lets Move To Installing Git In Our EC2 Server

##### To install git, run below commands in the terminal window:

```bash
  sudo apt-get update -y
```
```bash
  #sudo apt upgrade
  #sudo apt upgrade
  #sudo apt install -y git htop wget
  #well you don't have to get htop or wget until necessary so : 
  sudo apt-get install git -y
```
now to ensure that git is installed type the follwing command:
```bash
  git --version
```
This command will print the git version in the terminal.

Now Clone Your Server Repository where you have your server code

```bash
  git clone https://github.com/clone-your-repo
```

now change the directory to your cloned folder or directory and install the packages in your `package.json` file: 
```bash
  cd Connecting_Soulmate_Server
```
```bash
  npm install
```
to run the server:
```bash
  node app.js
```
###  Install pm2
```bash
  npm install -g pm2
```

#### Starting the app with pm2 (Run nodejs in background and when server restart)
```bash
  pm2 start app.js
```
```bash
  pm2 save
```
the above command # saves the running processes
                  # if not saved, pm2 will forget
                  # the running apps on next boot

#### If you want pm2 to start on system boot : 
```bash
  pm2 startup # starts pm2 on computer boot
```

Now all the steps required to run the server on EC2 is completed.


## Install Nginx For Proxy Setup And For Free SSL

```bash
sudo apt install nginx
```
```bash
sudo nano /etc/nginx/sites-available/default
```
### Add the following to the location part of the server block

##### before setting it up make sure you do not change anything but the `location` part:
```bash
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000; #whatever port your app runs on
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

##### check nginx config and restart it if no error occur :
```bash
sudo nginx -t
```
```bash
sudo service nginx restart
```

#### Obtain and Install SSL Certificate

##### Installing Certbot

##### Use Let's Encrypt to obtain a free SSL certificate with Certbot:
```bash 
sudo apt install certbot python3-certbot-nginx
```
##### Run Certbot to obtain the SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d subdomain.yourdomain.com
```
#### Configure Nginx for SSL
##### Modify the Nginx configuration to use SSL:
```bash
sudo nano /etc/nginx/sites-available/default
```
##### Update the configuration to include SSL settings:
```bash
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        # Your Nginx configuration goes here
    }
}
```

#### You should now be able to visit your IP with no port (port 80) and see your app. Now let's add a domain

#### This step is to point your ip address from the domain
     ->Check that Port 80 redirect to Nodejs server

confirm it by the same testing command
```bash
sudo nginx -t
```

```bash
sudo systemctl reload nginx
```

Now you have successfully applied the SSL to your domain

#### The last step is to set the certbot for auto-renewal

```bash
sudo systemctl status snap.certbot.renew.service
```
##### Check the crontab for Certbot's auto-renewal job:

##### Certbot usually adds a cron job or a systemd timer to handle the renewal process. You can check if it exists by running:
```bash
sudo crontab -u root -l
```
##### You should see something like this:
```bash
0 */12 * * * /usr/bin/certbot renew --quiet
#12 hrs

0 0 1 * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl restart nginx"
#1st day of month
```

##### If it's not set up, you can manually edit the cron job:
```bash
sudo crontab -u root -e
```
##### Add the following line to restart Nginx after renewal:
```bash
0 */12 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl restart nginx"
```

To test the renewal process, you can do a dry run with certbot:

```bash
sudo certbot renew --dry-run
```
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

##### For MongoDB Connection
`MONGODB_URI`

##### For jwt
`SECRET_KEY`
`JWT_SECRET`

##### Brevo Keys
`BREVO_API_KEY`
`SENDER_IDENTITY` # connecting-soulmate
`DOMAIN_EMAIL` # domain email from which the email will be sent
`ADMIN_EMAIL` # email of admin
`LOGO_IMAGE_URL` # logo url in emails
`FRONTEND_URL` # domain url for registration number url

#### S3 CREDENTIALS
`SECRET_ACCESS_KEY`
`ACCESS_KEY`
`BUCKET_NAME`
`BUCKET_REGION`

#### OTPless CREDENTIALS
`CLIENT_SECRET`
`CLIENT_ID`
`APP_ID`


## Tech Stack

**Client:** React JS, Context API, TailwindCSS, interceptors, axios, mui, OTPless

**Server:** Node, Express, Bcrypt, jsonwebtoken, MongoDB, Mongoose

