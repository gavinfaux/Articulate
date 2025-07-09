# Markdown Editor Feature

Were building a mobile optimised markdown editor using AlpineJs, however it's the CSP version which does not use unsafe-eval. Since Alpine can no longer interpret strings as plain JavaScript, it has to parse and construct JavaScript functions from them manually.

Due to this limitation, you must use Alpine.data() to register your x-data objects, and **must** reference properties and methods from it by key only. Nested properties are allowed.

To ease the transition of this update the controller should be updated to implement a state machine for tracking and control of the app status, current step, next and previous steps and methods and properties required for each stage of the process.

## Change set and related artifacts

* Reference documentation is located here: [AlpineJS CSP](https://alpinejs.dev/advanced/csp)
* The template is located from the solution .git root at src/Articules/App\_Plugins/Articulate/Views/MarkdownEditor.cshtml
* The CSS theme for the template is located at The located at src/Articules/App\_Plugins/Articulate/md-editor.css
* The templates AlpineJS controller is located at src/Articules/App\_Plugins/Articulate/md-editor.js
* The template is served as a .cshtml view by Umbraco version 15+ running ASP.NET Core, and a view model is injected into the template by the server side Umbraco controller to set initial
* An OpenAPI endpoint is used for communication with the server, this is currently used for authentication and posting of the completed Markdown model. The endpoint can be extened if other functionality is required, in which case you should pause and the User informed of the planned changes for futher validation.
* The OpenAPI Authentication controller endpoint code is located at src/Articulate/Controllers/ManagementApi/ArticulateAuthenticationController.cs
* The OpenAPI Markdown Editor endpoint code is located at src/Articulate/Controllers/ManagementApi/ArticulateMardownEditorController.cs
* Models for the OpenAPI endpoints are located at src/Articulate/Models/ManagementApi/**/*
* Browser Fetch API is used for communication with the server.
* [Pico CSS](https://picocss.com/docs) is used for styling the template along with the templates custom CSS theme, based on the [Material Pink/Blue theme](https://storage.googleapis.com/code.getmdl.io/1.3.0/material.pink-blue.min.css)
* The Markdown Editor component used to implement the editors functionality is [Tiny Markdown Editor](https://jefago.github.io/tiny-markdown-editor/) and [typescript source](https://raw.githubusercontent.com/jefago/tiny-markdown-editor/refs/heads/main/src/TinyMDE.ts) 
 - The template is a single page application.
 - Standard Javscript is used for coding.   


## Implementation


### Amendments to the Markdown Editor functionality 

#### Target audience

 - Template must be mobile first optimised and responsive. Target browsers and devices are iOS and Android phones and tablets. 
 - For Android this is versions 10 upwards, for iOS / Mobile safari this is versions 11 upwards.
  - Progressive enhancement is required, so the template should be able to be used on a desktop browser.

#### Step states

- Step states should use Object.freeze to prevent modification and allow for .
- Step state are "loading", "login", "editor", "optional", "success"
- Step state 
- submitting and error states are tracked separately.

#### Login View

- The login view should not display a message to the user on recieving a 401 response from the server.
- On recieving a 200 response with a TwoFactorRequiredResponse from the server and display the link returned in the RedirectUrl property. The link is relative to the site root.
- A 200 response with a LoginSuccessResponse can proceed to the next step is the editor view.
- Any other response from the server should be displayed to the user as an error message, this includes 400,423,403,401 and 500 responses. These return ProblemDetails objects from the OpenAPI response with a Title and Detail property.

#### Editor View

* Editor does not use a command bar, and uses a text area for editing
* Initial Editor height should fit the available space in the viewport between the header and footer elements.
* Editor should grow adapting to the content being edited rather than implement a fixed height with scrollbar, not shrinking below the viewport height.
* Editor features camera and image  upload buttons in the footer, these should only be displayed in the editor view.
* Editor view displays a next button which should only be enabled when the user has entered the post title and markdown content is not empty. 
- Next step is the options view.

##### File uploads

* The hidden file inputs for camera and image should only allow image mime types jpeg, png and gif.
* The file select/upload handler only allows image mime types jpeg, png and gif; any other file type should be rejected with a message to the user stating the allowed file types.
* The file select/upload handler only allows file extensiosns of jpg, jpeg, png and gif; any other file type should be rejected, with a message to the user
* The maximum file size for image uploads is 10MB ( 10 * 1024 * 1024 bytes), files above this size should be rejected, with a message to the user
* File names should be normalised `file.name.replace(/\\/g, "/")`
* After path normailsation file names should be checked for path traversal attacks `.match(/^\.\.|\/\.\./))`, files that match this pattern should be rejected with a message to the user.
* After traversal check file names should be sanitized to remove any invalid characters e.g. repeating `.`, paths or other characters that reqiure escaping.
* File names 



#### Options View
 - The options view displays the next and previouse button in the footer, all input fields are optional and can be left blank. 
 - Previous step in the editor view. 
 - Next step in the editor view.

#### Success View

- The success view should display the markdown content returned from the server.
- 




Step 1) First we should audit the template and gather a list of every x-data attribute that requires an API call rather than inline JavaScript, please display the list to the user.

Step 2, for every x-data attributes use case we must ensure we are only going to use





The Alpine template is

