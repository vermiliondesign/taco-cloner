# Taco Cloner
 ## Installation
  `npm install -g @vermiliondesign/taco-cloner`

## Usage
  ```
  $ git clone yourProject
  $ cd ProjectRoot
  $ taco.clone <projectName>
  ```
  
  This tool will take you through the process of accessing a projects production server via ssh tunnel, and the setup of an apache vhost. This assumes that Apache is set up through homebrew and that the Server Root is at `~/Sites/`.
  