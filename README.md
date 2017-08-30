# Taco Cloner
 ## Installation
  `npm install -g @vermilion/taco-cloner`

## Usage
  ```
  $ git clone yourProject
  $ cd ProjectRoot
  $ taco.clone <projectName>
  ```
  
  This tool will take you through the process of accessing a projects production server via ssh tunnel, and the setup of an apache vhost, which includes per-site error and access logs stored in `/usr/local/var/log/apache2/{{siteName}}`.
  
  ### Assumptions
  1. Apache is installed via Homebrew.
  1. Your Apache Server Root is  `~/Sites/`.
  1. Your local SSL cert lives at `/usr/local/etc/apache2/2.4/ssl/`
  1. You store vHosts in individual `.conf` files located at `/usr/local/etc/apache2/2.4/vhosts/`.
  
  
Please report any errors or feature requests.