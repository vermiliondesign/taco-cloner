# Taco Cloner
 ## Installation
  `npm install -g @vermilion/taco-cloner`

## Usage
  ```
  $ taco.clone <git URL>
  ```
  
  This tool will take you through the process of accessing a projects production server via ssh tunnel,  the setup of an apache vhost, which includes per-site error and access logs stored in `/usr/local/var/log/httpd/{{siteName}}`, the post installation scripts from composer and npm needed to get a site up and running. mySQL credentials exist, but don't do anything right now. 
  
  ### Assumptions
  1. Apache is installed via Homebrew.
  1. Your Apache Document Root is  `~/Sites/`.
  1. Your local SSL cert lives at `/usr/local/etc/httpd/ssl/`
  1. You store vHosts in individual `.conf` files located at `/usr/local/etc/httpd/vhosts/`.
  
  
Please report any errors or feature requests.