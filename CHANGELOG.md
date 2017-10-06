# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.12.0"></a>
# [1.12.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.11.2...v1.12.0) (2017-10-06)


### Features

* **CLI:** Add optional setting - file - for specifying a path to a siteshooter.yml file ([decb0b1](https://github.com/devopsgroup-io/siteshooter/commit/decb0b1))



<a name="1.11.2"></a>
## [1.11.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.11.1...v1.11.2) (2017-10-05)


### Bug Fixes

* **Update Notifier:** Update the default check interval ([1677ac5](https://github.com/devopsgroup-io/siteshooter/commit/1677ac5))



<a name="1.11.1"></a>
## [1.11.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.11.0...v1.11.1) (2017-10-05)



<a name="1.11.0"></a>
# [1.11.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.10.2...v1.11.0) (2017-10-04)


### Bug Fixes

* **Logging:** Pass arguments to log function and add a timestamp ([723c943](https://github.com/devopsgroup-io/siteshooter/commit/723c943))


### Features

* **Screenshot Delay Example:** Add working example of adjusting the default screenshot delay setting ([013a6bf](https://github.com/devopsgroup-io/siteshooter/commit/013a6bf))



<a name="1.10.2"></a>
## [1.10.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.10.1...v1.10.2) (2017-09-28)


### Bug Fixes

* **Content Collection:** Adjust jQuery selectors and remove a tag html collection ([29c144f](https://github.com/devopsgroup-io/siteshooter/commit/29c144f))



<a name="1.10.1"></a>
## [1.10.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.10.0...v1.10.1) (2017-09-27)


### Bug Fixes

* **Screen Shots:** Move onLoadFinished event listener to after the page open event ([2e42dc4](https://github.com/devopsgroup-io/siteshooter/commit/2e42dc4))



<a name="1.10.0"></a>
# [1.10.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.9.1...v1.10.0) (2017-09-27)


### Bug Fixes

* **Crawler:** Cleanup binding ([1005560](https://github.com/devopsgroup-io/siteshooter/commit/1005560))


### Features

* **Logging:** Add timestamp to verbose logging ([8d89639](https://github.com/devopsgroup-io/siteshooter/commit/8d89639))



<a name="1.9.1"></a>
## [1.9.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.9.0...v1.9.1) (2017-09-25)


### Bug Fixes

* **Screenshots:** Ensure the onLoadFinished function is registered once per page. ([6571a0a](https://github.com/devopsgroup-io/siteshooter/commit/6571a0a))



<a name="1.9.0"></a>
# [1.9.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.8.0...v1.9.0) (2017-09-21)


### Bug Fixes

* **Screenshot Process:** Ensure page has been loaded before generating screenshot. This includes capturing the document ready state and waiting until the status is reported as complete before moving onto the screenshot ([18062f3](https://github.com/devopsgroup-io/siteshooter/commit/18062f3))
* **Website Reporting:** Correct reported image sources for images missing an alt tag ([97915eb](https://github.com/devopsgroup-io/siteshooter/commit/97915eb))


### Features

* **Screenshot Image Quality:** Add setting to adjust image quality based on min and max numbers in range 0 (worst) to 100 (perfect) ([e4a0cc3](https://github.com/devopsgroup-io/siteshooter/commit/e4a0cc3))


### Performance Improvements

* **Sitemap:**  Cache sitemap links for multiple calls ([cbb7dd6](https://github.com/devopsgroup-io/siteshooter/commit/cbb7dd6))



<a name="1.8.0"></a>
# [1.8.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.7.0...v1.8.0) (2017-09-20)


### Bug Fixes

* **Website Reporting:** Show 401 response from Google PageSpeed API and remove depreciated write function ([0397021](https://github.com/devopsgroup-io/siteshooter/commit/0397021))


### Features

* **PDF:** Introduce image optimization for smaller pdf file sizes ([5eba7b0](https://github.com/devopsgroup-io/siteshooter/commit/5eba7b0))



<a name="1.7.0"></a>
# [1.7.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.6.2...v1.7.0) (2017-09-19)


### Bug Fixes

* **package:** Correct required node version ([f71945c](https://github.com/devopsgroup-io/siteshooter/commit/f71945c))
* **Site Crawler:** Report on a links, images, css files etc. and only include pages in sitemap ([4be48f0](https://github.com/devopsgroup-io/siteshooter/commit/4be48f0))
* **Test:** Correct formatting for Travis tests ([0a9f00c](https://github.com/devopsgroup-io/siteshooter/commit/0a9f00c))
* **Website Crawler:** Pass through crawler exclusions ([981b447](https://github.com/devopsgroup-io/siteshooter/commit/981b447))


### Features

* **Website Reporting:** Introduce Google SpeedTest API ([92d6f4a](https://github.com/devopsgroup-io/siteshooter/commit/92d6f4a))


### Performance Improvements

* **cli:** Rework node version validation ([3bd6b01](https://github.com/devopsgroup-io/siteshooter/commit/3bd6b01))



<a name="1.6.2"></a>
## [1.6.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.6.1...v1.6.2) (2017-09-15)



<a name="1.6.1"></a>
## [1.6.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.6.0...v1.6.1) (2017-09-14)


### Bug Fixes

* **screenshots:** Ensure there aren't any duplicate URLs when generating screenshots and content collection. ([246bb1c](https://github.com/devopsgroup-io/siteshooter/commit/246bb1c))


### Performance Improvements

* **sitemap:** Rework method chaining and report on duplicate sitemap.xml urls. ([0601734](https://github.com/devopsgroup-io/siteshooter/commit/0601734))



<a name="1.6.0"></a>
# [1.6.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.5.4...v1.6.0) (2017-09-08)


### Bug Fixes

* **screenshots:** Add timeout for phantom exit. ([772b988](https://github.com/devopsgroup-io/siteshooter/commit/772b988))


### Features

* **screenshots:** Add screenshot delay option. ([7073a10](https://github.com/devopsgroup-io/siteshooter/commit/7073a10))



<a name="1.5.4"></a>
## [1.5.4](https://github.com/devopsgroup-io/siteshooter/compare/v1.5.3...v1.5.4) (2017-08-30)


### Bug Fixes

* **crawler:** Correct promise chain and rework output. ([81cd587](https://github.com/devopsgroup-io/siteshooter/commit/81cd587))
* **screenshots:** Adjust timeouts for page loading and rendering. ([47858be](https://github.com/devopsgroup-io/siteshooter/commit/47858be))
* **screenshots:** Run screenshots for multiple viewports at once and collect webpage information once per page. ([d0baa84](https://github.com/devopsgroup-io/siteshooter/commit/d0baa84))
* **sitemap:** Ensure duplicates are not added to generated sitemap.xml file. ([27d2346](https://github.com/devopsgroup-io/siteshooter/commit/27d2346))
* Website reporting URLs and meta information. ([7f31837](https://github.com/devopsgroup-io/siteshooter/commit/7f31837))



<a name="1.5.3"></a>
## [1.5.3](https://github.com/devopsgroup-io/siteshooter/compare/v1.5.2...v1.5.3) (2017-08-29)


### Performance Improvements

* Bring npm modules up to date. ([42a2ff4](https://github.com/devopsgroup-io/siteshooter/commit/42a2ff4))



<a name="1.5.2"></a>
## [1.5.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.5.1...v1.5.2) (2017-07-12)


### Bug Fixes

* Remove ? character from folder name ([e2b719d](https://github.com/devopsgroup-io/siteshooter/commit/e2b719d))
* Remove ? character from folder name ([3dd1fad](https://github.com/devopsgroup-io/siteshooter/commit/3dd1fad))
* Remove duplicate pages in content collection, which was occurring if page event query strings were defined in a sitemap. ([9b47d37](https://github.com/devopsgroup-io/siteshooter/commit/9b47d37))
* **screenshots:** Avoid collecting duplicate content. ([d7db963](https://github.com/devopsgroup-io/siteshooter/commit/d7db963))
* **website:** Correct image src ([bdb286f](https://github.com/devopsgroup-io/siteshooter/commit/bdb286f))



<a name="1.5.1"></a>
## [1.5.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.5.0...v1.5.1) (2017-06-15)


### Bug Fixes

* Check for missing or blank alt tags ([ae52efd](https://github.com/devopsgroup-io/siteshooter/commit/ae52efd))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.4.0...v1.5.0) (2017-05-26)


### Bug Fixes

* Adjust error message to be more helpful. ([60a14d5](https://github.com/devopsgroup-io/siteshooter/commit/60a14d5))
* Fi issue with siteshooter —init option. ([c1e19e6](https://github.com/devopsgroup-io/siteshooter/commit/c1e19e6))
* Merge site shooter.yml default settings with user provided settings. ([34db1c3](https://github.com/devopsgroup-io/siteshooter/commit/34db1c3))
* Update config validation message. ([c664805](https://github.com/devopsgroup-io/siteshooter/commit/c664805))


### Features

* Enable website summary report option by default (only if an option hasnt’ been passed) ([bf37ef0](https://github.com/devopsgroup-io/siteshooter/commit/bf37ef0))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.3.0...v1.4.0) (2017-05-25)


### Bug Fixes

* **screenshots:**  Check for jQuery before using for content collection. ([536e589](https://github.com/devopsgroup-io/siteshooter/commit/536e589))
* Set promises and write out full website summary (urls, page titles, etc.) ([aa22a7c](https://github.com/devopsgroup-io/siteshooter/commit/aa22a7c))
* Update pdf meta information based on new content collection file. ([66e2cef](https://github.com/devopsgroup-io/siteshooter/commit/66e2cef))


### Features

* Output website summary in the console and an exported csv file. ([34a3831](https://github.com/devopsgroup-io/siteshooter/commit/34a3831))
* Return website collected information. ([6d0ea2a](https://github.com/devopsgroup-io/siteshooter/commit/6d0ea2a))


### Performance Improvements

* Move cli checks into cli module. ([46dfa41](https://github.com/devopsgroup-io/siteshooter/commit/46dfa41))
* Move config validation into config module. ([10e00cd](https://github.com/devopsgroup-io/siteshooter/commit/10e00cd))
* Move content collection to screenshot module ([23c5e06](https://github.com/devopsgroup-io/siteshooter/commit/23c5e06))
* Remove npm cheerio dependency. ([e200d23](https://github.com/devopsgroup-io/siteshooter/commit/e200d23))
* Update logging. ([1e254fc](https://github.com/devopsgroup-io/siteshooter/commit/1e254fc))
* Use util chalk functions. ([2d955a1](https://github.com/devopsgroup-io/siteshooter/commit/2d955a1))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.2.2...v1.3.0) (2017-05-18)


### Bug Fixes

* Add timeout option. ([8255704](https://github.com/devopsgroup-io/siteshooter/commit/8255704))
* siteshooter.yml validation ([4e54236](https://github.com/devopsgroup-io/siteshooter/commit/4e54236))


### Features

* Allowing for custom page event tags (query string parameter appended to sitemap url) passed into inject.js file and trigger custom JS events. ([2813e9e](https://github.com/devopsgroup-io/siteshooter/commit/2813e9e))


### Performance Improvements

* **module update:**  Update xmlbuilder to 9.0.0 ([19239ca](https://github.com/devopsgroup-io/siteshooter/commit/19239ca))
* Use q promise and remove when module dependency. ([690d442](https://github.com/devopsgroup-io/siteshooter/commit/690d442))



<a name="1.2.2"></a>
## [1.2.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.2.1...v1.2.2) (2017-05-16)


### Bug Fixes

* **screenshots:** Set Promise on custom injection script so the screenshot doesn’t render until after the inject.js is done running. ([3aae16f](https://github.com/devopsgroup-io/siteshooter/commit/3aae16f))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.2.0...v1.2.1) (2017-05-01)


### Bug Fixes

* **pdf-shooter:** Add cover page and additional console output. ([8c13b75](https://github.com/devopsgroup-io/siteshooter/commit/8c13b75))
* Let process handle exiting on error. ([abb17ab](https://github.com/devopsgroup-io/siteshooter/commit/abb17ab))


### Performance Improvements

* Optimize promise chaining. ([899189d](https://github.com/devopsgroup-io/siteshooter/commit/899189d))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.5...v1.2.0) (2017-04-28)


### Bug Fixes

* **pdf-shooter:** Correct output paths. ([dce0039](https://github.com/devopsgroup-io/siteshooter/commit/dce0039))
* **tests:** correct Mocha formatting. ([637d2d7](https://github.com/devopsgroup-io/siteshooter/commit/637d2d7))
* **tests:** Remove assertions. ([b0254ce](https://github.com/devopsgroup-io/siteshooter/commit/b0254ce))


### Features

* Move all sitemap logic into its own module. Do a diff on sitemap.xml and append new urls to file if file exists. ([7abedff](https://github.com/devopsgroup-io/siteshooter/commit/7abedff))


### Performance Improvements

* **screenshots:** Remove deprecated configuration	settings. ([2492d7a](https://github.com/devopsgroup-io/siteshooter/commit/2492d7a))



<a name="1.1.5"></a>
## [1.1.5](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.4...v1.1.5) (2017-04-27)


### Bug Fixes

* Ensure content-collection.json file exists. ([7295237](https://github.com/devopsgroup-io/siteshooter/commit/7295237))
* **crawler:** Prevent Salesforce sites from attempting to crawl the specified site. ([cea9f96](https://github.com/devopsgroup-io/siteshooter/commit/cea9f96))
* **screenshots:** Verify sitemap.xml file exist prior to screenshot process. ([4e9d87a](https://github.com/devopsgroup-io/siteshooter/commit/4e9d87a))


### Performance Improvements

* **screenshots:** Replace screenshot delay option with PhantomJS page onLoadFinished function. ([84c34b8](https://github.com/devopsgroup-io/siteshooter/commit/84c34b8))
* Rework callbacks. ([f0d8213](https://github.com/devopsgroup-io/siteshooter/commit/f0d8213))



<a name="1.1.4"></a>
## [1.1.4](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.3...v1.1.4) (2017-04-21)


### Performance Improvements

* Remove globby and graceful-fs dependencies ([9a990c4](https://github.com/devopsgroup-io/siteshooter/commit/9a990c4))



<a name="1.1.3"></a>
## [1.1.3](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.2...v1.1.3) (2017-03-30)


### Bug Fixes

* Remove sitemap configuration options as it’s not necessary. ([94b2c15](https://github.com/devopsgroup-io/siteshooter/commit/94b2c15))


### Performance Improvements

* Replace graceful-fs dependency with node core fs library ([0ed6bbc](https://github.com/devopsgroup-io/siteshooter/commit/0ed6bbc))
* Replace graceful-fs dependency with node core fs library ([0767ef6](https://github.com/devopsgroup-io/siteshooter/commit/0767ef6))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.1...v1.1.2) (2017-03-29)


### Bug Fixes

* **crawler:** Follow robots.txt rules. closes #24 ([993b221](https://github.com/devopsgroup-io/siteshooter/commit/993b221)), closes [#24](https://github.com/devopsgroup-io/siteshooter/issues/24)



<a name="1.1.1"></a>
## [1.1.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.1.0...v1.1.1) (2017-03-29)


### Bug Fixes

* **crawler:** don’t override user agent. ([842c552](https://github.com/devopsgroup-io/siteshooter/commit/842c552))
* **crawler:** trim white space. ([1ecce04](https://github.com/devopsgroup-io/siteshooter/commit/1ecce04))
* **pdf-shooter:** Exclude pdf links in sitemap.xml file. ([fd10061](https://github.com/devopsgroup-io/siteshooter/commit/fd10061))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/devopsgroup-io/siteshooter/compare/v1.0.1...v1.1.0) (2017-03-28)


### Bug Fixes

* **crawler:** trim white space. ([d8b3305](https://github.com/devopsgroup-io/siteshooter/commit/d8b3305))


### Features

* **cli:** verify node version. ([cea2c6d](https://github.com/devopsgroup-io/siteshooter/commit/cea2c6d))
* **pdf-shooter:** Generate PDF in the order of the sitemap file. ([da52a4a](https://github.com/devopsgroup-io/siteshooter/commit/da52a4a))
* **screenshots:**  Inject custom JS script is an inject.js file exists in the working directory. ([4eed3a9](https://github.com/devopsgroup-io/siteshooter/commit/4eed3a9))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/devopsgroup-io/siteshooter/compare/v1.0.0...v1.0.1) (2017-03-22)


### Bug Fixes

* **Travis CI:** Update supported node versions to test. ([f509701](https://github.com/devopsgroup-io/siteshooter/commit/f509701))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.11.0...v1.0.0) (2017-03-21)

### BREAKING CHANGES

* drop support for Node < 6.0 to enable usage of new tools and packages.

<a name="0.11.0"></a>
# [0.11.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.10.0...v0.11.0) (2017-03-21)


### Bug Fixes

* **crawler:** add extension docx to the crawler exclusion list ([62b088d](https://github.com/devopsgroup-io/siteshooter/commit/62b088d))
* **crawler:** allow user defined options to set Simple Crawler properties. ([097e874](https://github.com/devopsgroup-io/siteshooter/commit/097e874))
* **screenshots:** check for ignoreInvalidSSL option and set ‘--ignore-ssl-errors=yes’ ([86104df](https://github.com/devopsgroup-io/siteshooter/commit/86104df))


### Features

* **add quiet argument:** move package update checker ([a3da7d0](https://github.com/devopsgroup-io/siteshooter/commit/a3da7d0))


### Performance Improvements

* **module update:** simplecrawler from version 0.7.0 to 1.1.1 ([d3ae0f6](https://github.com/devopsgroup-io/siteshooter/commit/d3ae0f6))



<a name="0.10.0"></a>
# [0.10.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.9.2...v0.10.0) (2016-07-27)


### Bug Fixes

* check for undefined meta data ([3c0bb84](https://github.com/devopsgroup-io/siteshooter/commit/3c0bb84))


### Features

* add SimpleCrawler cache ([cab0476](https://github.com/devopsgroup-io/siteshooter/commit/cab0476))


### Performance Improvements

* **module update:** globby ([12fda28](https://github.com/devopsgroup-io/siteshooter/commit/12fda28))



<a name="0.9.2"></a>
## [0.9.2](https://github.com/devopsgroup-io/siteshooter/compare/v0.9.1...v0.9.2) (2016-07-18)


### Bug Fixes

* **read:** fix broken link ([316dfe2](https://github.com/devopsgroup-io/siteshooter/commit/316dfe2))


### Performance Improvements

* **module update:** lodash ([3beaabf](https://github.com/devopsgroup-io/siteshooter/commit/3beaabf))
* **module update:** standard version ([1d8b84a](https://github.com/devopsgroup-io/siteshooter/commit/1d8b84a))
* **module update:** update-notifier ([567c789](https://github.com/devopsgroup-io/siteshooter/commit/567c789))
* **module update:** xml2js ([98ef773](https://github.com/devopsgroup-io/siteshooter/commit/98ef773))
* **module update:** yamljs ([d89698c](https://github.com/devopsgroup-io/siteshooter/commit/d89698c))
* add additional extension exclusion ([d4065e3](https://github.com/devopsgroup-io/siteshooter/commit/d4065e3))
* update globby module ([d885089](https://github.com/devopsgroup-io/siteshooter/commit/d885089))



<a name="0.9.1"></a>
## [0.9.1](https://github.com/devopsgroup-io/siteshooter/compare/v0.9.0...v0.9.1) (2016-05-12)


### Bug Fixes

* **screenshots:** add file exclusions for screen shooting and capture page JS errors and report on resources not loading ([4179eb7](https://github.com/devopsgroup-io/siteshooter/commit/4179eb7))
* **screenshots:** formatting ([7ecb737](https://github.com/devopsgroup-io/siteshooter/commit/7ecb737))



<a name="0.9.0"></a>
# [0.9.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.8.0...v0.9.0) (2016-05-10)


### Bug Fixes

* **crawler:** add WordPress specific files to ignore when crawling a site ([eda3336](https://github.com/devopsgroup-io/siteshooter/commit/eda3336))
* **pdf-shooter:** resolves issue with PDF generation for smaller viewports ([dbeb547](https://github.com/devopsgroup-io/siteshooter/commit/dbeb547))

### Features

* **module:** add update-notifier module to help end-users know when a new version is released ([0b1fd79](https://github.com/devopsgroup-io/siteshooter/commit/0b1fd79))

### Performance Improvements

* **update modules:** remove del module as it's not being used ([b107a61](https://github.com/devopsgroup-io/siteshooter/commit/b107a61))
* **update modules:** remove request module as it's not being used ([1a0fa02](https://github.com/devopsgroup-io/siteshooter/commit/1a0fa02))
* **update modules:** simple-crawler to version 0.7.0 ([df7ba9f](https://github.com/devopsgroup-io/siteshooter/commit/df7ba9f))
* collapse sitemap functionality into the crawler module ([6003219](https://github.com/devopsgroup-io/siteshooter/commit/6003219))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.7.2...v0.8.0) (2016-05-05)


### Bug Fixes

* **cli:** correct website command ([9d086c9](https://github.com/devopsgroup-io/siteshooter/commit/9d086c9))

### Features

* **crawler:** add additional metadata when crawling host ([eaaef4d](https://github.com/devopsgroup-io/siteshooter/commit/eaaef4d))
* **crawler:** add crawler command to CLI ([97ded92](https://github.com/devopsgroup-io/siteshooter/commit/97ded92))
* **crawler:** add crawler function to tasks ([590dec1](https://github.com/devopsgroup-io/siteshooter/commit/590dec1))
* **crawler:** add new crawler module ([8f09ed7](https://github.com/devopsgroup-io/siteshooter/commit/8f09ed7))
* **pdf-shooter:** add Google Analytics version to cover page ([c9c44f7](https://github.com/devopsgroup-io/siteshooter/commit/c9c44f7))
* **user options:** add user options for the pdf generation process ([55c1f4b](https://github.com/devopsgroup-io/siteshooter/commit/55c1f4b))
* **user options:** add user options for the site crawler process ([c7ac6dc](https://github.com/devopsgroup-io/siteshooter/commit/c7ac6dc))
* **user options:** add user options for the site crawler process ([26af72f](https://github.com/devopsgroup-io/siteshooter/commit/26af72f))
* **user options:** add user options for the site crawler process ([f3ffd0f](https://github.com/devopsgroup-io/siteshooter/commit/f3ffd0f))
* **website:** add GA version function check ([83726d3](https://github.com/devopsgroup-io/siteshooter/commit/83726d3))



<a name="0.7.2"></a>
## [0.7.2](https://github.com/devopsgroup-io/siteshooter/compare/v0.7.1...v0.7.2) (2016-04-25)


### Bug Fixes

* **pdf-generation:** add meta data on separate page ([d922be2](https://github.com/devopsgroup-io/siteshooter/commit/d922be2)), closes [#28](https://github.com/devopsgroup-io/siteshooter/issues/28)

### Performance Improvements

* **pdf-shooter:** use function for writing text to PDF ([96cb5e0](https://github.com/devopsgroup-io/siteshooter/commit/96cb5e0))
* **site-shooter:** remove unnecessary code ([d79aab5](https://github.com/devopsgroup-io/siteshooter/commit/d79aab5))
* **sitemap:** move statement (variable) out of function ([ecdf731](https://github.com/devopsgroup-io/siteshooter/commit/ecdf731))



<a name="0.7.1"></a>
## [0.7.1](https://github.com/devopsgroup-io/siteshooter/compare/v0.7.0...v0.7.1) (2016-04-21)


### Bug Fixes

* **content-collection:** ensure casing won't be an issue ([3e51d97](https://github.com/devopsgroup-io/siteshooter/commit/3e51d97)), closes [#29](https://github.com/devopsgroup-io/siteshooter/issues/29)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/devopsgroup-io/siteshooter/compare/v0.6.1...v0.7.0) (2016-04-21)


### Features

* **conventional-changelog-standard:** incorporate the standard-version npm module into the project and start adhering to Github's conventional changelog standard ([62a0af0](https://github.com/devopsgroup-io/siteshooter/commit/62a0af0)), closes [#26](https://github.com/devopsgroup-io/siteshooter/issues/26)
