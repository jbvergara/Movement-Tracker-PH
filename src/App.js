//Source Files
import logo from './logo.png';
import './App.css';

//REACT MODULES
import { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

//FIREBASE MODULES
import { initializeApp } from "firebase/app";
import { getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

//ESRI/ARCGIS MODULES
import { loadModules } from 'esri-loader';
import { ApplicationSession } from '@esri/arcgis-rest-auth';

//FIREBASE INIT
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
}

const app = initializeApp(firebaseConfig);
const AuthInstance = getAuth(app);


//ARCGIS AUTH INIT
let token;
const session = new ApplicationSession({
  clientId: process.env.REACT_APP_ARCGIS_CLIENT_ID,
  clientSecret: process.env.REACT_APP_ARCGIS_CLIENT_SECRET
});
session.getToken("https://www.arcgis.com/sharing/rest/oauth2/token").then(value => token = value);

//ERROR DICT
const errorDict = {
  "auth/invalid-email": "Invalid Email/Password",
  "auth/wrong-password": "Invalid Email/Password",
  "auth/email-already-in-use": "User already exists",
  "auth/weak-password": "Password must be at least 8 characters"
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [user, loading, error] = useAuthState(AuthInstance);
  const [name, setName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmpassword, setConfirmPassword] = useState('');
  
  const signIn = async () => {
    if (!email.length || !password.length) return
    var status = await AuthCheck(email, password); 
    if (status){
      console.log(status.code);
      setErrorCode(errorDict[status.code]);
    }
  }

  const signUp = async() => {
    if (!name.length || !createEmail.length || !createPassword.length || !confirmpassword.length) return
    if (createPassword !== confirmpassword) {
      setErrorCode("Passwords do not match");
      return
    }
    var status = await CreateCheck(email, password); 
    if (status){
      console.log(status.code);
      setErrorCode(errorDict[status.code]);
    }
    console.log("Account Created successfully!")
  }

  const BottomLink = (props) => {
    return(
      <div className="mt-5 flex items-center justify-center pb-5">
        <div className="text-base 2xl:text-xl">
            <p onClick={() => setErrorCode('')} className="font-medium text-red-700 hover:text-red-500">
              {props.word}
            </p>
        </div>
      </div>
    )
  }

  async function CreateCheck(email, password) {
    try {
      await createUserWithEmailAndPassword(AuthInstance, createEmail, createPassword);
    } catch (err) {
      return err;
    }
  }

  async function AuthCheck(email, password) {
    try {
      await signInWithEmailAndPassword(AuthInstance, email, password)
    } catch (err) {
      return err;
    }
  }

  function ProcessLogout() {
    AuthInstance.signOut();
    setErrorCode('');
  }
  
  const Main = () => {
    loadModules([
      'esri/WebMap',
      'esri/Map',
      'esri/views/MapView',
      'esri/config',
      'esri/layers/FeatureLayer',
      'esri/widgets/TimeSlider',
      'esri/widgets/Expand',
      'esri/widgets/Legend',
      'esri/layers/support/TimeInfo',
      'esri/renderers/ClassBreaksRenderer',
      'esri/PopupTemplate',
      'esri/TimeExtent'
    ]).then(([
        WebMap,
        Map,
        MapView, 
        esriConfig, 
        FeatureLayer,
        TimeSlider,
        Expand,
        Legend,
        TimeInfo,
        ClassBreaksRenderer,
        PopupTemplate,
        TimeExtent
      ]) => {
        let layerView;

        //API CONFIG
        esriConfig.apiKey = process.env.REACT_APP_ARCGIS_API_KEY;
        
        //CONFIGURE INTERCEPT
        esriConfig.request.interceptors.push({
          // set the `urls` property to the URL of the FeatureLayer so that this
          // interceptor only applies to requests made to the FeatureLayer URL
          urls: ["https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2020/FeatureServer/3",
          "https://services3.arcgis.com/RIea9L4JuvuT5SES/arcgis/rest/services/final_data/FeatureServer/0"],
          // use the BeforeInterceptorCallback to add token to query
          before: function setToken(params) {
            params.requestOptions.query = params.requestOptions.query || {};
            params.requestOptions.query.token = token;
          }
        });
    
        const time_info = new TimeInfo({
            startField: "time",
            interval: {
              unit: "days",
              value: 1
            }
        });
    
        const renderer = new ClassBreaksRenderer({
          field: "all_day_ratio_single_tile_users",
          legendOptions: {
            title: "Proportion of population that did not leave their city/municipality"
          },
        });

        function renderConfig (min, max, color) {
          return ({
            minValue: min,
            maxValue: max,
            symbol: {
              type: 'simple-marker',  
              color: color,
              size: 10
            }
          })
        }
        renderer.addClassBreakInfo(renderConfig(0, 0.22, "#a63603"));
        renderer.addClassBreakInfo(renderConfig(0.23, 0.29, "#e6550d"));
        renderer.addClassBreakInfo(renderConfig(0.30, 0.37, "#fd8d3c"));
        renderer.addClassBreakInfo(renderConfig(0.38, 0.44, "#fdbe85"));
        renderer.addClassBreakInfo(renderConfig(0.45, 0.80, "#feedde"));

        const popup_template = new PopupTemplate({
          title: "Data Information",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "polygon_name",
                  label: "Location",
                  visible: true
                },
                {
                  fieldName: "all_day_ratio_single_tile_users",
                  label: "Proportion of population that stayed within the city/municipality",
                  visible: true
                },
                {
                  fieldName: "date",
                  label: "Date",
                  visible: true
                }
              ]
            }
          ]
        });

        const data_layer = new FeatureLayer({
          url: "https://services3.arcgis.com/RIea9L4JuvuT5SES/arcgis/rest/services/final_data/FeatureServer/0",
          apiKey: process.env.REACT_APP_ARCGIS_APP_API_KEY,
          tilte: "PH Movement Data",
          outFields: ["all_day_ratio_single_tile_users", "time"],
          timeInfo: time_info,
          renderer: renderer,
          geometryType: "point",
          popupTemplate: popup_template
        });

        //MAP INIT
        const map = new Map({
          basemap: "dark-gray-vector",
          layers: [data_layer]
        });

        //MAPVIEW INIT
        const view = new MapView({
          map: map,
          center: [121.7740, 12.8797], // Longitude, latitude
          zoom: 4, // Zoom level
          container: "viewDiv" // Div element 
        });

        const timeSlider = new TimeSlider({
          playRate: 1000,
          stops: {
            interval: {
              value: 1,
              unit: "days"
            }
          }
        });
        view.ui.add(timeSlider, "top-left");
        
        view.whenLayerView(data_layer).then((lv) => {
          layerView = lv;

          const start = new Date(2021, 0, 1); // start time of the time slider - 1/1/2021
          // set time slider's full extent to 9/27/2021 - until end date of layer's fullTimeExtent
          timeSlider.fullTimeExtent = {
            start: start,
            end: data_layer.timeInfo.fullTimeExtent.end
          };

          let end = new Date(start); // happened between 1/1 - 1/2.
          
          end.setDate(end.getDate() + 1); // end of current time extent for time slider
        });

        timeSlider.watch("timeExtent", () => {
          //filter later to show data less than the end of time slider
          data_layer.definitionExpression =
            "time <= " + timeSlider.timeExtent.end.getTime();

          // now gray out data that happened before the time slider's current
          layerView.effect = {
              filter: {
                timeExtent: timeSlider.timeExtent,
                geometry: view.extent
              },
              excludedEffect: "grayscale(1%)",
              includedEffect: "opacity(100%)"
            };
          
          const statQuery = layerView.effect.filter.createQuery();
          statQuery.outStatistics = [avgCompliance, maxCompliance];

          data_layer.queryFeatures(statQuery).then((result) => {
            let htmls = [];
            statsDiv.innerHTML = "";
            if (result.error) {
              return result.error;
            } else {
              if (result.features.length >= 1) {
                const attributes = result.features[0].attributes;
                var name;
                for (name in statsFields) {
                  if (attributes[name] && attributes[name] != null) {
                    const html =
                      "<br/>" +
                      statsFields[name] +
                      " <b><span>" +
                      attributes[name].toFixed(2) + 
                      "</span></b>";
                    htmls.push(html);
                  }
                }
                const yearHtml =
                  "<span>" +
                  "</span> Data recorded between " +
                  timeSlider.timeExtent.start.toLocaleDateString() +
                  " - " +
                  timeSlider.timeExtent.end.toLocaleDateString() +
                  ".<br/>";

                if (htmls[0] === undefined) {
                  statsDiv.innerHTML = yearHtml;
                } else {
                  statsDiv.innerHTML =
                    yearHtml + htmls[0] + htmls[1]
                }
              }
            }
          })
          .catch((error) => {
            console.log(error);
          });
        });

        const avgCompliance = {
          onStatisticField: "all_day_ratio_single_tile_users",
          outStatisticFieldName: "avg_compliance",
          statisticType: "avg"
        };

        const maxCompliance = {
          onStatisticField: "all_day_ratio_single_tile_users",
          outStatisticFieldName: "max_compliance",
          statisticType: "max"
        };

        const statsFields = {
          avg_compliance: "Average:",
          max_compliance: "Maximum:"
        };


        const legendExpand = new Expand({
          collapsedIconClass: "esri-icon-collapse",
          expandIconClass: "esri-icon-expand",
          expandTooltip: "Legend",
          view: view,
          content: new Legend({
            view: view
          }),
          expanded: true
        });
        view.ui.add(legendExpand, "top-right");

        const statsDiv = document.getElementById("statsDiv");
        const infoDiv = document.getElementById("infoDiv");
        const infoDivExpand = new Expand({
          collapsedIconClass: "esri-icon-collapse",
          expandIconClass: "esri-icon-expand",
          expandTooltip: "Expand Data info",
          view: view,
          content: infoDiv,
          expanded: false
        });
        view.ui.add(infoDivExpand, "top-right");

      }).catch(function(error) {
        console.log("Error:", error);
          // request failed, handle errors
    });
    return(
      <div className="bg-gray-200 font-sans leading-normal tracking-normal flex flex-col">
        <nav id="header" className="w-full">
          <div className="relative w-full top-0 bg-red-900">
            <div className="w-auto px-0 mx-auto flex flex-wrap items-center justify-between mt-0 py-4">
              <Link to="/">
                <MainHeaderLogo />
              </Link>
              <div className="pr-4">
                <button id="nav-toggle" className="lg:hidden flex items-center px-3 py-2 border rounded text-grey border-grey-dark hover:text-black hover:border-purple appearance-none focus:outline-none">
                  <svg className="fill-white h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path></svg>
                </button>
              </div>
              <div className="w-full flex-grow lg:flex lg:flex-1 lg:content-center lg:justify-end lg:w-auto hidden mt-2 lg:mt-0 z-20" id="nav-content">
                <ul className="list-reset lg:flex justify-end items-center">
                  <li className="mr-3 py-2 lg:py-0">
                    <p className="inline-block py-2 px-4 text-gray-50 font-bold no-underline">
                      {user.email}
                    </p>
                  </li>
                  <li className="mr-3 py-2 lg:py-0">
                    <Link to="/">
                      <p 
                        onClick={() => ProcessLogout()}
                        className="inline-block text-grey-dark no-underline text-gray-50 hover:text-white hover:underline py-2 px-4"
                      >Logout
                      </p>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div id="viewDiv" className="w-screen h-screen"></div>
          <div id="timeSlider"></div>
          <div id="infoDiv" className="esri-widget">
            <div> <b>Movement Data Philippines</b></div><br/>
            <div id="statsDiv" className="esri-widget"></div>
          </div>
        </nav>
      </div>
      
    )
  }
  
  if (loading){
    return (
      <LoadingScreen />
    )
  }

  if (error){
    return(
      <h1>Contact Administrator</h1>
    )
  }

  if (user!=null){
    document.onclick = check;
    console.log("Authenticated!");

    function check(e) {
      var navMenuDiv = document.getElementById("nav-content");
      var navMenu = document.getElementById("nav-toggle");
      var target = (e && e.target);
      //Nav Menu
      if (!checkParent(target, navMenuDiv)) {
          // click NOT on the menu
        if (checkParent(target, navMenu)) {
            // click on the link
          if (navMenuDiv.classList.contains("hidden")) {
              navMenuDiv.classList.remove("hidden");
          } 
          else {
              navMenuDiv.classList.add("hidden");
          }
        }
      }
    }
  
    function checkParent(t, elm) {
      while (t.parentNode) {
        if (t === elm) {
            return true;
        }
        t = t.parentNode;
      }
      return false;
    }

    return(
      <Router>
        <Switch>
          <Route exact path="/">
            <Main />
          </Route>

          <Route exact path="/create">
            <Main />
          </Route>
        </Switch>
      </Router>
    )
  }

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <div className="App min-h-screen bg-gray-500">
            <div className="bgcontainer bg-local">
              <Link to="/">
                <AppHeader />
              </Link>
              <div className="min-h-screen flex justify-center px-4 bg-scroll">
                <div className="max-w-2xl px-8 mt-12 2xl:mt-20 mb-auto loginform border-solid border-gray-300 border-4 rounded-xl border-opacity-50 bg-gray-50 bg-opacity-75">
                  <FormHeader word="Sign-in to your account"/>
                    <div className="mt-8 space-y-6 mb-3 rounded-md shadow-sm -space-y-px">
                      <div>
                        <label htmlFor="email-address" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm 2xl:text-xl"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="sr-only">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm 2xl:text-xl"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <div id="ErrorMessage" className="text-sm 2xl:text-xl">
                          <p className="font-medium text-red-700">
                            {errorCode}
                          </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        id="signIn-loading"
                        onClick={() => signIn()}
                        className="group relative w-full flex 2xl:text-xl justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3"></span>
                        Sign in
                      </button>
                    </div>
                  <Link to="/create">
                    <BottomLink word="Create Account" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Route>

        <Route exact path="/create">
          <div className="App min-h-screen bg-gray-500">
              <div className="bgcontainer bg-local">
                <Link to="/">
                  <AppHeader />
                </Link>
                <div className="min-h-screen flex justify-center px-4 bg-scroll">
                  <div className="min-w-min px-10 space-y-5 2xl:space-y-4 mt-12 2xl:mt-20 mb-auto loginform border-solid border-gray-300 border-4 rounded-xl border-opacity-50 bg-gray-50 bg-opacity-75">
                    <FormHeader word="Sign-up"/>
                      <div className="mt-8 space-y-2 rounded-md shadow-sm max-w-2xl opacity-90">
                        <div>
                          <label htmlFor="Full Name" className="sr-only">
                            Name
                          </label>
                          <input
                            id="full-name"
                            name="full-name"
                            type="text"
                            autoComplete="name"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base 2xl:text-xl"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label htmlFor="email-address" className="sr-only">
                            Email address
                          </label>
                          <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base 2xl:text-xl"
                            placeholder="Email address"
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="password" className="sr-only">
                            Password
                          </label>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base 2xl:text-xl"
                            placeholder="Password"
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                          />
                        </div>

                        <div>
                          <label htmlFor="confirmpassword" className="sr-only">
                            Password
                          </label>
                          <input
                            id="confirmpassword"
                            name="confirmpassword"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base 2xl:text-xl"
                            placeholder="Confirm Password"
                            value={confirmpassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <div id="ErrorMessage" className="text-sm 2xl:text-xl">
                            <p className="font-medium text-red-700">
                              {errorCode}
                            </p>
                        </div>
                      </div>
                      <div className="mx-16">
                        <button
                          type="submit"
                          onClick={() => signUp()}
                          className="group relative w-full flex 2xl:text-xl justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                          </span>
                          Create Account
                        </button>
                      </div>
                    <Link to="/">
                      <BottomLink word="Sign-in" />
                    </Link>
                  </div>
                </div>
              </div>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

const AppHeader = () => {
  return (
    <div className="App-header justify-center flex flex-row">
      <div className="flex-row flex-nowrap flex items-center justify-center bg-gray-200 bg-opacity-75 rounded-3xl mt-10 max-w-min px-12 text-3xl md:text-5xl 2xl:text-7xl">
        <img src={logo} className="opacity-90 w-1/12 py-2" alt="logo" />
        <div className="typewriter text-black">
          <h1>Movement Tracker Philippines</h1>
        </div>
      </div>
    </div>
  )
}

const FormHeader = (props) => {
  return(
    <div>
      <h2 className="mt-6 text-center text-xl md:text-2xl 2xl:text-4xl font-extrabold text-gray-800">
        {props.word}
      </h2>
      <p className="mt-2 text-center text-sm 2xl:text-base text-gray-600"></p>
    </div>
  )
}

const LoadingScreen = () => {
  return(
    <div className=" flex justify-center flex-col items-center mt-52">
      <div className="animate-spin mb-10 rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      <div className="text-black text-lg">LOADING</div>
    </div>
  );
}

const MainHeaderLogo = () => {
  return (
    <div className="pl-3 flex items-center">
        <svg className="h-5 pr-3 fill-white text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M17.94 11H13V9h4.94A8 8 0 0 0 11 2.06V7H9V2.06A8 8 0 0 0 2.06 9H7v2H2.06A8 8 0 0 0 9 17.94V13h2v4.94A8 8 0 0 0 17.94 11zM10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/>
        </svg>
        <p className=" text-gray-50 text-xl no-underline hover:no-underline font-extrabold"> Movement Tracker PH</p>
    </div>
  )
}