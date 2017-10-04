# Siteshooter Examples

#### Screenshot Delay Setting

Experiencing issues with overlays or modals not 100% loaded before the screenshot process happens? If so, try increasing the **delay** setting in your siteshooter.yml file

```yml
screenshot_options:
  delay: 4000
``` 

To see console.logs reported from your custom **inject.js** file, use the --debug argument when running siteshooter:

```bash
$ siteshooter --debug
``` 



---
>##### Do you need a website and workflow management platform?
> <img src="https://cdn.rawgit.com/devopsgroup-io/catapult/master/repositories/apache/_default_/svg/catapult.svg" alt="Catapult website and workflow management platform" width="30"> **[Give Catapult a shot](https://github.com/devopsgroup-io/catapult)**
---
