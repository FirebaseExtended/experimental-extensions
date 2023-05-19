// Copyright 2023 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

namespace Firebase.Sample.Leaderboard
{
  using System;
  using System.Collections;
  using System.Collections.Generic;
  using System.Linq;
  using System.Threading.Tasks;

  using Firebase;
  using Firebase.Auth;
  using Firebase.Extensions;
  using Firebase.Firestore;

  using UnityEngine;

  // Handler for UI buttons on the scene.  Also performs some
  // necessary setup (initializing the firebase app, etc) on
  // startup.
  public class UIHandler : MonoBehaviour
  {
    public GUISkin fb_GUISkin;
    private Vector2 controlsScrollViewVector = Vector2.zero;
    private Vector2 scrollViewVector = Vector2.zero;
    bool UIEnabled = true;
    private string logText = "";
    const int kMaxLogSize = 16382;
    DependencyStatus dependencyStatus = DependencyStatus.UnavailableOther;
    protected FirebaseAuth auth = null;
    protected FirebaseFirestore firestore = null;

    protected string displayName = "";
    protected string uid = "";
    protected string scoreString = "";

    // Path to the collection to query on.
    protected string leaderboardCollectionPath = "leaderboards";
    protected string leaderboardDocName = "global_leaderboard";

    protected string userCollectionPath = "users";
    protected string userScoreFieldName = "score";

    // When the app starts, check to make sure that we have
    // the required dependencies to use Firebase, and if not,
    // add them if possible.
    public virtual void Start()
    {
      FirebaseApp
        .CheckAndFixDependenciesAsync()
        .ContinueWithOnMainThread(task =>
        {
          dependencyStatus = task.Result;
          if (dependencyStatus == DependencyStatus.Available)
          {
            InitializeFirebase();
          }
          else
          {
            Debug.LogError("Could not resolve all Firebase dependencies: " + dependencyStatus);
          }
        });
    }

    // Exit if escape (or back, on mobile) is pressed.
    public virtual void Update()
    {
      if (Input.GetKeyDown(KeyCode.Escape))
      {
        Application.Quit();
      }
    }

    // Handle initialization of the necessary firebase modules:
    void InitializeFirebase()
    {
      DebugLog("Get Auth and Firestore.");
      auth = FirebaseAuth.DefaultInstance;
      firestore = FirebaseFirestore.DefaultInstance;
    }

    void OnDestroy()
    {
      auth = null;
      firestore = null;
    }

    bool checkSDKs()
    {
      if (auth == null)
      {
        DebugLog("FirebaseAuth default instances is null, check initialization.");
        return false;
      }
      if (firestore == null)
      {
        DebugLog("FirebaseFirestore default instances is null, check initialization.");
        return false;
      }
      return true;
    }

    private string DisplayLeaderBoard(IDictionary<string, object> leaderboard)
    {
      IDictionary<string, IDictionary> converted = new Dictionary<string, IDictionary>();
      foreach (KeyValuePair<string, object> entry in leaderboard)
      {
        // Cast the value of leaderboard entry into a dictionary to make it easy to sort by score.
        Dictionary<string, object> castedObject = (Dictionary<string, object>)(entry.Value);
        converted.Add(entry.Key, castedObject);
      }
      DebugLog(String.Format("Converted dict size {0}...", converted.Count));

      var ordered = converted
        .OrderByDescending(x => x.Value["score"])
        .ToDictionary(x => x.Key, x => x.Value);
      return "{ "
        + ordered
          .Select(
            kv =>
              "(Uid:"
              + kv.Key
              + ", UserName:"
              + kv.Value["user_name"]
              + ", Score:"
              + kv.Value["score"]
              + ")\n"
          )
          .Aggregate("", (current, next) => current + next + ", ")
        + "}";
    }

    // Fetch the leaderboard document and display.
    public Task FetchLeaderboardAsync()
    {
      if (!checkSDKs())
      {
        return Task.FromResult(0);
      }
      DebugLog("Attempting to fetch leaderboard...");
      DisableUI();

      // This passes the current displayName through to HandleCreateUserAsync
      // so that it can be passed to UpdateUserProfile().  displayName will be
      // reset by AuthStateChanged() when the new user is created and signed in.
      DocumentReference leaderboardDoc = firestore
        .Collection(leaderboardCollectionPath)
        .Document(leaderboardDocName);
      return leaderboardDoc
        .GetSnapshotAsync()
        .ContinueWithOnMainThread(task =>
        {
          EnableUI();
          if (task.IsCanceled)
          {
            DebugLog("INFO: Fetch leaderboard was cancelled.");
          }
          else if (task.IsFaulted)
          {
            DebugLog("ERROR: " + task.Exception.ToString());
          }
          else if (task.Result == null)
          {
            DebugLog("ERROR: Invalid task result.");
          }
          else
          {
            DocumentSnapshot snap = task.Result;
            IDictionary<string, object> resultData = snap.ToDictionary();
            if (resultData != null && resultData.Count > 0)
            {
              DebugLog("INFO: Read leaderboard contents:");
              DebugLog(DisplayLeaderBoard(resultData));
            }
            else
            {
              DebugLog("INFO: leaderboard was empty.");
            }
          }
        });
    }

    // Update User Score by Uid.
    public Task UpdateUserScoreAsync()
    {
      if (!checkSDKs())
      {
        return Task.FromResult(0);
      }
      if (auth.CurrentUser == null)
      {
        DebugLog("Sign-in before update score.");
        // Return a finished task.
        return Task.FromResult(0);
      }

      DebugLog(
        String.Format(
          "Attempting to Update User {0} with Score {1} ...",
          auth.CurrentUser.UserId,
          scoreString
        )
      );
      DisableUI();

      // This passes the current displayName through to HandleCreateUserAsync
      // so that it can be passed to UpdateUserProfile().  displayName will be
      // reset by AuthStateChanged() when the new user is created and signed in.
      DocumentReference leaderboardDoc = firestore
        .Collection(userCollectionPath)
        .Document(auth.CurrentUser.UserId);
      int scoreNumber;
      if (!Int32.TryParse(scoreString, out scoreNumber))
      {
        DebugLog(String.Format("Score string failed to parse {0} to int, early out.", scoreString));
        // Return a finished task.
        return Task.FromResult(0);
      }
      return leaderboardDoc
        .UpdateAsync(userScoreFieldName, scoreNumber)
        .ContinueWithOnMainThread(task =>
        {
          EnableUI();
          if (task.IsCanceled)
          {
            DebugLog("INFO: Update scoreString was cancelled.");
          }
          else if (task.IsFaulted)
          {
            DebugLog("ERROR: " + task.Exception.ToString());
          }
          else
          {
            DebugLog("INFO: Document updated successfully.");
          }
        });
    }

    // Called when a sign-in without fetching profile data completes.
    void HandleSignInWithUser(Task<Firebase.Auth.FirebaseUser> task)
    {
      EnableUI();
      if (LogTaskCompletion(task, "Sign-in"))
      {
        DebugLog(String.Format("{0} signed in", task.Result.DisplayName));
      }
    }

    // Attempt to sign in anonymously.
    public Task SigninAnonymouslyAsync()
    {
      if (!checkSDKs())
      {
        return Task.FromResult(0);
      }
      DebugLog("Attempting to sign anonymously...");
      DisableUI();
      return auth.SignInAnonymouslyAsync().ContinueWithOnMainThread(HandleSignInWithUser);
    }

    // Log the result of the specified task, returning true if the task
    // completed successfully, false otherwise.
    bool LogTaskCompletion(Task task, string operation)
    {
      if (task.IsCanceled)
      {
        DebugLog(operation + " canceled.");
      }
      else if (task.IsFaulted)
      {
        DebugLog(operation + " encounted an error.");
        foreach (Exception exception in task.Exception.Flatten().InnerExceptions)
        {
          string errorMessage = "";
          FirebaseException firebaseException = exception as FirebaseException;
          if (firebaseException != null)
          {
            errorMessage = String.Format(
              "Error code={0}: ",
              firebaseException.ErrorCode.ToString(),
              firebaseException.Message
            );
          }
          DebugLog(errorMessage + exception.ToString());
        }
      }
      else if (task.IsCompleted)
      {
        DebugLog(operation + " completed");
      }
      return false;
    }

    // Output text to the debug log text field, as well as the console.
    public void DebugLog(string s)
    {
      print(s);
      logText += s + "\n";

      while (logText.Length > kMaxLogSize)
      {
        int index = logText.IndexOf("\n");
        logText = logText.Substring(index + 1);
      }

      scrollViewVector.y = int.MaxValue;
    }

    void DisableUI()
    {
      UIEnabled = false;
    }

    void EnableUI()
    {
      UIEnabled = true;
    }

    // Render the log output in a scroll view.
    void GUIDisplayLog()
    {
      scrollViewVector = GUILayout.BeginScrollView(scrollViewVector);
      GUILayout.Label(logText);
      GUILayout.EndScrollView();
    }

    // Render the buttons and other controls.
    void GUIDisplayControls()
    {
      if (UIEnabled)
      {
        controlsScrollViewVector = GUILayout.BeginScrollView(controlsScrollViewVector);

        GUILayout.BeginVertical();

        if (GUILayout.Button("Get Leaderboard"))
        {
          FetchLeaderboardAsync();
        }
        GUILayout.Space(20);

        // Add User Section
        GUILayout.BeginHorizontal();
        GUILayout.Label("Display Name:", GUILayout.Width(Screen.width * 0.20f));
        displayName = GUILayout.TextField(displayName);
        GUILayout.EndHorizontal();
        if (GUILayout.Button("Add User"))
        {
          SigninAnonymouslyAsync();
        }

        // Update Score Section
        GUILayout.BeginHorizontal();
        GUILayout.Label("Score:", GUILayout.Width(Screen.width * 0.20f));
        scoreString = GUILayout.TextField(scoreString);
        GUILayout.EndHorizontal();
        if (GUILayout.Button("Update Score"))
        {
          UpdateUserScoreAsync();
        }

        GUILayout.EndVertical();
        GUILayout.EndScrollView();
      }
    }

    // Render the GUI:
    void OnGUI()
    {
      GUI.skin = fb_GUISkin;
      if (dependencyStatus != DependencyStatus.Available)
      {
        GUILayout.Label("One or more Firebase dependencies are not present.");
        GUILayout.Label("Current dependency status: " + dependencyStatus.ToString());
        return;
      }
      Rect logArea,
        controlArea;

      if (Screen.width < Screen.height)
      {
        // Portrait mode
        controlArea = new Rect(0.0f, 0.0f, Screen.width, Screen.height * 0.5f);
        logArea = new Rect(0.0f, Screen.height * 0.5f, Screen.width, Screen.height * 0.5f);
      }
      else
      {
        // Landscape mode
        controlArea = new Rect(0.0f, 0.0f, Screen.width * 0.5f, Screen.height);
        logArea = new Rect(Screen.width * 0.5f, 0.0f, Screen.width * 0.5f, Screen.height);
      }

      GUILayout.BeginArea(logArea);
      GUIDisplayLog();
      GUILayout.EndArea();

      GUILayout.BeginArea(controlArea);
      GUIDisplayControls();
      GUILayout.EndArea();
    }
  }
}
