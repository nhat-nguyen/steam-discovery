steam-discovery
==============

a bot for automating viewing Steam's discovery queues (useful for getting _Trading Cards_)

### dependencies
+ [`casperjs 1.1-beta3`](http://casperjs.org)
+ [`phantomjs`](http://phantomjs.org)

### usage
+ `casperjs steam-discovery.js --cookies-file=cookies.txt YourUsername YourPassword`

### known issues
+ the script may fail at times because of network timeout (_waiting time exceeds 60s_), or __Steam__'s strange behaviours
+ current workaround is to rerun the script, or optionally remove the cookies file

### disclaimer
+ use this at your own risk

### screenshot
![demo](https://raw.githubusercontent.com/nhat-nguyen/steam-discovery/master/demo.png)

