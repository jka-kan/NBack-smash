# NBack Smash - The Most Difficult 3D N-Back Game

You can test the live version at:

[http://www.nbacksmash.com](URL)

Django database files are not included in this code. In order to run it, Django must be initialized in the root directory and paths updated in the settings files accordingly. Also Three.js must be installed. See instructions below.


--------------------

NBack Smash is a game based based on so called dual-task n-back which continously challenges player's short term memory and concentration. It was introduced by Wayne Kirchner in 1958.
Several scientific studies have been conducted, some of which claim that not only better memory performance but also increase of IQ and fluid intelligence can be measured on test subjects who have been playing n-back over a certain period of time.
*(For example Li, Zhang, Qiao and others: Dual n-back working memory training evinces superior transfer effects compared to the method of loci, Scientific Report 3072(2021))*


The player has to constantly update his short term working memory (WM) when new information is received. The dual n-back makes this even more difficult because the player has to store two different types of data in WM.

The game principle is simple. The player is shown a sequence of squares or cubes in 3x3 grid. Places of squares has to be remembered n-amount cycles backwards.

For example, if the numbers 1-9 represent different locations in the grid and n = 2, a random sequence would have these matches marked with parentheses :

3, 4, 4, 5, (4), 1, 9, 6, (9), 5, 5...


The same applies to sounds played simoultanesly with a different set of matches.
Most implementations of n-back game use pronounced letters as a sound, but in NBack Smash piano notes are played in different pitches.
Musical notes are more abstract and probably more difficult to remember, at least to those who don't have musical skills.

At the end, results of the sequence (default 20 cycles) are shown and registered users can review their improvement in form of chart representation.

Compared to other similar games NBack Smash is designed to be more challenging. The player has an option to have visual distractions and the grid can be rotated so that one has to remember positions relatively to grid in stead of thinking sequence as series of "moves". 3D rotation makes the playing even more difficult, because the player momentarily sees the grid from the behind so that he has to think locations as a mirror image. It is possible to speed up the rotation and cycle intervals.

The statistics page shows two types of results:
- user's right answers divided by the total amount of n-back matches in the sequence
- score points adjusted with the difficulty level.

The user can change various settings, for instance rotation speed and direction, sequence length, keys used to signal answers, speed of distractions and sound volume.


Read more about dual n-back task:

[https://en.wikipedia.org/wiki/N-back](URL)



&nbsp;

# System Requirements

The NBack-game should work in all modern browsers and operating systems capable of running Python and Django.

In order to be fully functional following requirements must be met:

  * Three.js module must be installed
  * Browser must support WebGL
  * Sounds and Javascript must be turned on in browser settings

&nbsp;

Three.js can be installed with this command:


    npm install three


Please refer to documentation for more instructions:

[https://threejs.org/docs/#manual/en/introduction/Installation](URL)

&nbsp;

The game runs with command:

    python manage.py runserver

&nbsp;


# The Structure of the Game


## Web pages:
&nbsp;


**layout.html**

        Header and background for all other pages


**index.html**

        Game canvas, status information, basic settings and controls


**advanced_settings.html**

        Some advanced settings affecting the game routine


**statistics.html**

        Displays chart of user's results


**login.html**

        User authentication


**register.html**

        User registration

**styles.css**

        CSS definitions. It uses **body::before** to display background
        because background opacity needs to reduced without affecting other elements on the page.

&nbsp;


## Routines:

**app.js**

        Main routines, initialization, data processing, event listeners, 2D and 3D graphics.
        This is called from index.html as a module.
        Two sequences (grid_sequence, sound_sequence) are created for storing box places
        and different sound.
        
        The app uses sequence_pointer to track and get current place and sound.
        Initial value has to -1 because the game routine increases pointer after start.

        playField controls cycles by calling graphics and sound routines,
        and flagging to event listeners when user is allowed to press play buttons.

        2D graphics routine uses Javascript Canvas object to animate the grid.
        3D graphics uses Three.js module.

        It should be noted at functions load_data() and prePopulate() are used
        to populate settings fields because anonymous users cannot use
        database to get current settings.

**stats.js**

        Chart.js routines which show game results for registered users,
        called from statistics.html as a module.

**views.py**

        Processes user settings and game results. These are sent to app.js and stats.js.
        
        Settings are first saved in request.session["settings"],
        but if the user is authenticated, data will also be saved in the models.
        Registered user will get settings used in last session.      

        Settings of an anonymous user are saved only in session.
        This preventsoverloading of database. 
        Results of anonymous user are not saved, user has to log in to use this feature.

        Input data validation routine (AdvancedSetting().clean) uses custom clean method
        which is called by form.clean() method.
        It raises ValidationError in case of invalid data.

**models.py**

        The models are User, UserData (settings) and Result.
        UserData contains both basic and advanced settings,
        but they are serialized with separate methods.

        parse_defaults() method is used to get default settings and prepopulate fields
        when a new user loads the game or Reset button is clicked. 

**admin.py**

        Classes for admin login.

**tests.py**

        Routines used to test the structure of models.

**urls.py (nback_app dir)**

        Paths.


**Directory static/nback_app**

        Contains media resources needed to run the game.
        Directory "sounds" has 9 piano notes as separate mp3-files.
        "pics" contains background and logo images,
        including some alternatives not currently in use.

&nbsp;



## Future Implementations

The code is designed in a way which allows implementation of new data fields to models.

Following features can be added at later stage:

  * User defined colors for grid, squares and cubes
  * 3D textures for better visual effects
  * Polyphonic sounds that make remembering more difficult (f. ex. intervals and chords)
  * Letters and symbols instead of cubes in different places

&nbsp;


## Issues

Some browsers (at least Firefox) can throw "WebGL Renderer Error" on console. This can be related to browser or operating system settings, and doesn't seem to have any effect on the game itself. Enabling/disabling GPU acceleration in browser can solve this issue in same cases.

&nbsp;


**Enjoy playing the most difficult NBack game. Good luck!**


