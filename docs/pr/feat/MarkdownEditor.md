# Markdown Editor Feature

Were building a mobile optimised markdown editor using AlpineJs, however it's the CSP version which does not use unsafe-eval. Since Alpine can no longer interpret strings as plain JavaScript, it has to parse and construct JavaScript functions from them manually.

Due to this limitation, you **must** use Alpine.data() to register your x-data objects, attributes and methods and functions, in the view template reference properties by key/name only, use names for and functions, following AlpineJS CSP documentations and guidelines. Nested properties are allowed.

To ease the transition of this update the controller should be updated to implement a state machine for tracking and control of the app status, current step, next and previous steps and methods and properties required for each stage of the process.

## Change set and related artifacts

* Reference documentation is located here: [AlpineJS CSP](https://alpinejs.dev/advanced/csp)
* The template is located from the solution .git root at src/Articulate/App_Plugins/Articulate/Views/MarkdownEditor.cshtml
* The CSS theme for the template is located at The located at src/Articulate/App_Plugins/Articulate/md-editor.css
* The templates AlpineJS controller is located at src/Articulate/App_Plugins/Articulate/md-editor.js
* The template is served as a .cshtml view by Umbraco version 15+ running ASP.NET Core, and a view model is injected into the template by the server side Umbraco controller to set initial
* An OpenAPI endpoint is used for communication with the server, this is currently used for authentication and posting of the completed Markdown model. The endpoint can be extended if other functionality is required, in which case you should pause and the User informed of the planned changes for further validation.
* The OpenAPI Authentication controller endpoint code is located at src/Articulate/Controllers/ManagementApi/ArticulateAuthenticationController.cs
* The OpenAPI Markdown Editor endpoint code is located at src/Articulate/Controllers/ManagementApi/ArticulateMarkdownEditorController.cs
* Models for the OpenAPI endpoints are located at src/Articulate/Models/ManagementApi/**/*
* Browser Fetch API is used for communication with the server.
* [Pico CSS](https://picocss.com/docs) is used for styling the template along with the templates custom CSS theme, based on the [Material Pink/Blue theme](https://storage.googleapis.com/code.getmdl.io/1.3.0/material.pink-blue.min.css)
* The Markdown Editor component used to implement the editors functionality is [Tiny Markdown Editor](https://jefago.github.io/tiny-markdown-editor/) and [typescript source](https://raw.githubusercontent.com/jefago/tiny-markdown-editor/refs/heads/main/src/TinyMDE.ts)

* You *Will* need to reference the [Material Pink/Blue theme](https://storage.googleapis.com/code.getmdl.io/1.3.0/material.pink-blue.min.css) to duplicate colors, animation effects, pseudo-classes styles and other material design elements, e.g. labels styled to appear inside inputs acting like a placeholder.

* You can reference the previous legacy Markdown Editor template at src/Articulate/App_Plugins/Articulate/Legacy/** for .cshtml template, angular 1.2 controller and css custom theme additions and overrides.

## Implementation

* The template is a single page application.
* Standard Javascript is used for coding.
* DO NOT CHANGE MODEL FIELD NAMES, this is a breaking change.
* Previous, next, camera and upload buttons are display in the footer as circular buttons.
* The app does not display *ANY* messages to the users for errors and validation issues, instead it uses material design style element style changes to indicate required fields, next fields and errors
* You may add properties and methods as required for state tracking and control of the app status, current step, next and previous steps and methods and properties required for each stage of the process.

### Target audience

* BackOffice editors and writers that what to author Markdown blog style content while out of office or on the move.
* Template must be mobile first optimised and responsive. Target browsers and devices are iOS and Android phones and tablets.
* For Android this is versions 10 upwards, for iOS / Mobile safari this is versions 11 upwards.
* Progressive enhancement is required, so the template should be able to be used on a desktop browser.
  
### Markdown Editor functionality

While we have a working template, there are a number of areas that require further work to implement the full Markdown Editor functionality.

### Step states

* Step states should use Object.freeze for cleaner code.
* Step state are "loading", "login", "editor", "optional", "success"
* Submitting and error states are tracked separately.
* If the server returns a status code other than 200 range status code a console.warn message should be logged to the console. These return a status code and ProblemDetails like object from the OpenAPI response with either a Title and Detail property or string field.
* Network errors should be logged to the console as console.error messages.

### Login View

* The login view should not display a message to the user on receiving a 401 response from the server when checking authentication status.
* On receiving a 200 response with a TwoFactorRequiredResponse from the server display an href link returned in the RedirectUrl property labelled as user friendly complete login text. The link is relative to the site root.
* A 200 response with a LoginSuccessResponse can proceed to the next step is the editor view.
* Any other response from the server should use material design style effects to indicate field issues. .
* Email and password fields are required.

### Editor View

* Editor does not use a command bar, and uses a text area for editing
* Initial Editor height should fit the available space in the viewport between the header and footer elements.
* Editor should grow adapting to the content being edited rather than implement a fixed height with scrollbar, not shrinking below the viewport height.
* Editor features camera and image  upload buttons in the footer, these should only be displayed in the editor view.
* Editor view displays a next button which should only be enabled when the user has entered the post title and markdown content is not empty.

* Next step is the options view.

#### Editor File uploads

* The hidden file inputs for camera and image should only allow image mime types jpeg, png and gif.
* The file select/upload handler only allows image mime types jpeg, png and gif; any other file type should be rejected, tracking an internal error state / message
* The file select/upload handler only allows file extensions of jpg, jpeg, png and gif; any other file type should be rejected, tracking an internal error state / message
* The maximum file size for image uploads is 10MB ( 10 *1024* 1024 bytes), files above this size should be rejected, tracking an internal error state / message
* File names should be normalised `file.name.replace(/\\/g, "/")`
* After path normalisation file names should be checked for path traversal attacks `.match(/^\.\.|\/\.\./))`, files that match this pattern should be rejected, tracking an internal error state / message
* After traversal check file names should be sanitized to remove any invalid characters e.g. repeating `.`, paths or other characters that require escaping.
* After checks file names should be validated for length > 0 && < 255 characters, files that do not meet this criteria should be rejected, tracking an internal error state / message
* For valid files the file select/upload handler uses a temporary placeholder url in the format
`tmp:${index}:${file.name}`

* For valid files the the File and placeholder are stored in a Map for later submission to the server with the markdown post model.

* For valid files the markup to be inserted into the markdown editor should use the format `![${file.name}](${placeholderUrl})`
* For rejected/invalid files the error state / message should be logged to the console as a console.info, and no markup should be inserted into the markdown editor.

### Options View

* The options view displays the previous and and next buttons in the footer, all input fields are optional and can be left blank.
* Previous step is the editor view.
* Next steps submits the post the model and files to the server and on success displays the success view

#### Success View

* The success view should should just display a success label with a hyper link to view the post with URL retrieved from the servers CreatePostResponse labelled as "Click here to view your post"
* The success view should also display a link to return to the editor view if the user wishes to add a new post (so state should be cleared, with the exception of login state).

### Planning and implementation steps

* This requirements / PRD document can be found at docs/pr/feat/MarkdownEditor.md for reference.
* You should make a solid detailed plan for the implementation of this feature.
* You should pause on milestones to allow the user to review and provide feedback and record checkpoints.
* Prefer small functional code over large changes, classes or methods, this will make it easier to review and test.
* As far a possible use DRY and KISS principles, this will make it easier to review and test.
* Lint and and diff your proposed code changes to ensure quality and reduce risk of large scale changes and lost features.
* If you are unsure of ANY aspect of the implementation, pause and ask for feedback.
* If you repeatedly have issues or errors with the implementation, pause and ask for feedback.
