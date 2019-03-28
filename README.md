


## How we assign components to modules 

This insures each component only can access the state from the module its part of.


1) here's the intermediary data structure we generate in a single babel pass:

```js
const fileDeps = {
  '/src/components/LayoutModule.js': {
    moduleName: 'layout-module', // not every file will have this; only files with `createModule` will have it, but at the end we can assign one to each file
    importDependencies: [
      '/src/components/FooComponent.js', 
      '/src/components/AnotherModule.js',
      'etc'
    ]
  },
  '/src/components/AnotherModule.js': {
    moduleName: 'another-module',
    importDependencies: []
  },
  '/src/components/FooComponent.js': { // will inherit layout-module
    importDependencies: [
      '/src/components/BazComponent.js' // also will inherit layout-module
    ]
  },
}
```


2) in the `completion` hook that babel offers, we convert it to a simple hash in a json file we generate:
```js
const moduleNamesByFileName = {
  '/src/components/LayoutModule.js': 'layout-module',
  '/src/components/FooComponent.js': 'layout-module',
  '/src/components/BazComponent.js': 'layout-module',
  '/src/components/AnotherModule.js': 'another-module',
}
```

3) the developer has to be sure to import the `moduleNamesByFileName` json file we generate, and supply it to the runtime, eg: `createStore(moduleNamesByFileName, reducers, selectors, initialState, enhancer)`



4) then pillar #1 of the babel plugin is modified to pass the name of the--and this is the trick--CURRENT FILE when acquiring state, eg: `const state = useRemixxState('/src/components/AnotherModule.js');`

```js
const RemixxComponent = (props) => {
  const state = useRemixxState('/src/components/AnotherModule.js') // babel plugin simply injects name of current file!
  const dispatch = useRemixxDispatch()
  const actions = useRemixxActions()
  return MyComponent(props, state, bindActions(dispatch, actions))
}
```
> Remixx is our fork of Redux



## Modules Look like this

```js
// main module
export default createModule({
  name: '345456645', // importing module specifies namespace
  components,
  reducers,
  routes: {
    HOME: {
      path: '/home'
    },
    FEED: {
      path: '/feed',
      thunk: ({ state, actions }) => {
        if (!state.user && state.cookie) return actions.auth.login({ params: { state.cookie } })
        if (!state.user) return actions.auth.signup() // havent figured this out yet, but basically, all action creators need to be available ALWAYS like the `routeDepsManifest` below, and they need to be assigned namespaces like `auth`, which overates the numerical guaranteed-to-be-unique generated ID; this is the final piece
      }
    }
  }
})

// auth module
export default createModule({
  name: '234345345', // namespace is generated at first
  components,
  reducers,
  routes: {
    SIGNUP: {
      path: '/signup'
    },
    LOGIN: {
      path: '/login/:param',
      thunk: ({ api, params }) => api.fetch(params.param)
    }
  }
})
```


```js
const moduleNamesByFileName = {
  '/src/components/AuthModule.js': '234345345', // replaced with "auth" or whatever parent module names it
}
```


## A Manifest of action type to module import is generated and sent to the client

```js
const routeDepsManifest = {
  HOME: () => import('modules/main'), // notice these 2
  FEED: () => import('modules/main'), // import the same chunk/remixxModule
  SIGNUP: () => import('modules/signup'),
  LOGIN: ({ param }) => import(`modules/login/${param}`)
}
```
> Routes can be built while the "airplane is flying" just based on this little amount of info. THEREFORE WE CAN AUTOMATICALLY SPLIT ALL ROUTES!

These import() functions are the equivalent of `route.load`. Essentially they exist for every single route now, and are automatically generated. NO need to specify them.



## Reducers need to receive types injected too:

```js
const myReducer = (state, action, types, actions) => {
  if (action.type === types.FOO) ... // where real FOO type might be FOO/234345345
}
```

## actions.auth.signup() ??

SO you might have saw this above. this is key. All actions creators for yet-to-be-loaded routes need to be available in all other routes. OR, we gotta implement a system where parent routes only have the actions to potential routes you can navigate to. 

That sounds even more complex. So let's just figure out how to get all the action creators we need first, and optimize later.

The second bit is this: `actions.auth` is the namespace.  So look at this:

```js
// auth module
export default createModule({
  name: '234345345', // namespace is generated at first
```

Our babel plugin will assign the name/id `234345345` which is basically just a hash of the file name, which is guaranteed to be unique. All imported components before the next "module boundary" will be assigned this hash id. That insures that when they access state, they access just the same namespace.


What that means is that the following from above:

```js
const moduleNamesByFileName = {
  '/src/components/LayoutModule.js': 'layout-module',
  '/src/components/FooComponent.js': 'layout-module',
  '/src/components/BazComponent.js': 'layout-module',
  '/src/components/AnotherModule.js': 'another-module',
}
```

is actually this:


```js
const moduleNamesByFileName = {
  '/src/components/LayoutModule.js': '234345345',
  '/src/components/FooComponent.js': '234345345',
  '/src/components/BazComponent.js': '234345345le',
  '/src/components/AnotherModule.js': '12342343434',
}
```

or in this case:
```js
const moduleNamesByFileName = {
  '/src/components/AuthModule.js': '234345345',
}
```


Then what I have in mind is this:

```js
loadModule('auth', () => import('modules/authModule'))
```

which changes our hash to:

```js
const moduleNamesByFileName = {
  '/src/components/AuthModule.js': 'auth', // now we can refer to this module in parent modules via `auth`
}
```

This enables `actions.auth.login()`, eg:

```js
FEED: {
      path: '/feed',
      thunk: ({ state, actions }) => {
        if (!state.user && state.cookie) return actions.auth.login({ params: { state.cookie } })
        if (!state.user) return actions.auth.signup()
```


So we've come a long way at this point. But what we are now missing is 2 things:

A) How we get all the actions, i.e. as generated via `createScene`. We'll have to add em to another manifest like `routeDepsManifest`. Hopefully we can keep that small

B) More importantly, where `loadModule('auth', () => import('modules/authModule'))` is actually called to make name the anonymous numerical namespace `auth`. The problem is that multiple parent modules may import the `auth` namespace. So we have to find the perfect (hopefully singular) place to name a module.

Let's forget A for a second. Imagine this: some of th4e above modules created via `createModule` are on NPM and made by 3rd parties, e.g. a Stripe module made for Respond (yay!). So Stripe won't name the module `payment`. Within their code, the babel plugin will have generated this:

```js
export default createModule({
  name: '234345345',
  components,
  reducers,
  routes
})
```

However, in our app, when we load this module, we need to assign it to a namspace, which will prefix all actions, and which will namespace the state in the store. So the following has to happen somewhere:

```js
loadModule('payment', () => import('stripe'))
```

Again, the problem is we may use the Stripe module in several of our own modules. And in several of our routes. Let's just say for a moment, different of our modules can refer to it by different namespaces (similar to how ES6 modules can be imported into different files and assigned different aliases). In that case, I imagine a module must simply state its dependencies, eg:


```js
export default createModule({
  name: 'parent-module',
  components,
  reducers,
  routes,
  dependencies: [
    payment: () => import('stripe'),
  ]
})
```

> now we can use `actions.payment.charge()` or something because the actions of all deps are bundled into the parent!


Let's look at how the original example looks according to this approach.


```js
// main module
export default createModule({
  name: '345456645', // generated ID by babel plugin (hashing of current file name)
  components,
  reducers,
  routes: {
    HOME: {
      path: '/home'
    },
    FEED: {
      path: '/feed',
      thunk: ({ state, actions }) => {
        if (!state.user && state.cookie) return actions.auth.login({ params: { state.cookie } })
        if (!state.user) return actions.auth.signup() 
      }
    }
  },
  dependencies: [
    auth: () => import('modules/authModule'),
  ]
})
```

Now, I'm not exactly sure how the above relates to our manifest:

```js
const routeDepsManifest = {
  HOME: () => import('modules/main'), 
  FEED: () => import('modules/main'),
  SIGNUP: () => import('modules/auth'),
  LOGIN: () => import(`modules/auth`)
}
```

->

```js
const routeDepsManifest = {
  HOME: {
    load: () => import('modules/main'),
  },
  FEED: {
    load: () => import('modules/main'),
    action: ['customCreator'],
    customCreator
  }
}
```
> other info we need to *fully* generate action creators is scene, basename, formatter, subtypes


I guess the deps is some sort of compiler flag we must parse with babel to insure we get the actions for deps in the parente, g: `actions.auth.signup()`. Maybe there is no `routeDepsManifest`, but just the dependencies, and we use that to insure the parent has the action creators, nothing more. 

I think that's it. Now I just gotta think through how we will intelligently get the actions out of the child and into the parent. At compile time? Runtime? A little of both? Basically we gotta generate the action creators at compile time, and then embed them in the parent module, so they can be executed at first load of the parent, so that its then on available in the runtime. 

In Conclusion, almost all of the hard problems we're solving is dependent on compile time code generation. Moreover, what's unique about what we're doing is that we're doing a hybrid approach. It's not so different than all the webpack stuff with manifests. It's more like routing/redux-specific manifests which are also in relation to splitting. 



## NEXT: make parent state available in child module:

```js
export default createModule({
  name: '345456645',
  components,
  reducers,
  routes: {
    HOME: {
      path: '/home'
    },
  },
  dependencies: [
    payment: {
      load: () => import('modules/stripe'),
      stateMappings: {
        user: 'session',
        pay: 'charge'
      }
    }
  ]
})
```

The idea here is that the stripe module expects to have access to `state.session` and `state.charge`, but in the parent module, they are available as `state.user` and `state.pay`. So we have to provide mappings.

That results in the following working correctly, and accessing a single time-travellable store:

```js
const MyRemixxComponent = (props, state, actions) => {
  return <div>{state.session}</div>
}
```

So in our DevTools the real value is `state.session`, which is essentially being aliased. 


## LAST: Action creator generation

So basically the plan is to use our `createScene` utilities to generate actions statically at build time! Then we can embed their corresponding code into parent modules, and insure parent modules can dispatch the actions corresponding to all deps. 

Hopefully that doesn't add too much to the chunk size. A minimal amount of information is needed to generate actions, basically just the routesMap keys. But unfortunately there's a few key/vals on each route which can customize the generation of these actions, so we gotta parse those with the babel plugin and paste them into the action creator manifest, which is ultimately used along with `createScene` to generate the final action creators AT RUNTIME.




## NESTED ROUTES + MODULES!!!

```js
export default createModule({
  name: '345456645',
  components,
  reducers,
  routes: {
    HOME: {
      path: '/home'
    },
    CHECKOUT: {
      path: '/checkout',
      routes: {
        STEP1: {
          path: '/step-1', // final path: /checkout/step-1
        },
        STEP2: {
          path: '/step-2', // final path: /checkout/step-2
        },
        PAYMENT: {
          load: () => import('modules/stripe'),
          path: '/payment',
          appendChildPaths: false, // children dont use parent's segment, but may use grandparent etc, eg: /checkout/thank-you
          stateMappings: {
            user: 'session',
            pay: 'charge'
          }
        }
      },
    },
    AUTH: {
      load: () => import('modules/auth'), // routes that will map to the top level
      stateMappings: {
        user: 'user',
      }
    }
  },
})

// stripe module
export default createModule({
  components,
  reducers,
  routes: {
    CHARGE: {
      thunk: ({ stripe, payload }) => stripe.charge(payload)
    },
    CONFIRMATION: {
      path: '/thank-you',
    }
  }
})


// auth module
export default createModule({
  components,
  reducers,
  routes: {
    SIGNUP: {
      path: '/signup',
      action: ['customCreator'],
      customCreator
    },
    LOGIN: {
      path: '/login/:param',
      thunk: ({ api, params }) => api.fetch(params.param)
    },
    HELP: {
      path: '/help',
      appendPath: '/forgot-password', // u can speciy an alternative path to append to
      load: () => import('modules/forgotPassword'),
    }
  }
})
```

So the above will appear partially in the manifest like the following (keep in mind there is tons of KBs saved from being sent over the wire because the reducers, components and 90% of each route isn't sent over the wire in the first load):


```js
const { store, firstRoute } createApp({
  main: {
    load: () => import('modules/main'),
    routes: {
      HOME: {},
      CHECKOUT: {
        load: () => import('modules/checkout'),
        routes: {
          STEP1: {},
          STEP2: {},
          PAYMENT: {
            load: () => import('modules/stripe'),
            routes: {
              CHARGE: {},
              CONFIRMATION: {}
            }
          }
        },
      }
    }
  },
  auth: {
    load: () => import('modules/auth'),
    routes: {
      LOGIN: {},
      SIGNUP: {}
    }
  }
}, {
  initialState, // redux initial state(createApp does createRouter + createStore!!)
  enhancer, // redux enhancer!
  // ...rest of the rudy options
}, [
  codeSplit('load'
  call('beforeEnter'),
  call('enter')
  call('thunk')
])


const render = App => {
  ReactDOM.hydrate(
    <AppContainer>
      <Provider store={store}>
        <App />
      </Provider>
    </AppContainer>,
    document.getElementById('root')
  )
}

(async function() {
  await store.dispatch(firstRoute())
  render(App)
})()
```

TBD:
- scene creation requires knowledge of route.path + route.scene


## Misc Problems/Solutions

- Actions prevent conflicts by the same strategy as components, where state (and actions) are powered by a proxy, which makes available only the action creators + state slices available to the particular
module.

- like `stateMappings` possibly there is also `actionMappings` that use the proxy mechanism to allow
child reducers to listen to parent action types

-parent reducers can listen to all child action types, by virtue of the developer choosing to do so throgh
knowing the child namespaces, eg: `checkout.payment.CHARGE` could be listened to in reducers from the top level `CHECKOUT` module, or perhaps even in other parallel modules like `HOME`. But the inverse isn't true without using `actionMappings` (i.e. children have to be explicitly given access, in order to prevent conflicts by child modules that are supposed to be clueless of where they are used). See, that's the difference, parent modules, get to know whats up with the children, but not the other way around (kind of like in real live :)). ...That makes me think about selectors--parent module selectors may also want access to child module selectors. That should be fine, but that's a bridge I'm ok with crossing when we get to it; unlike most this other stuff I intuit it doesn't need to be as aggressively pre-planned.

-what about module routes that are used just as namespaces, but without paths, eg: 

```js
AUTH: {
  load: () => import('modules/auth'), // routes that will map to the top level
}
```

What I came up with is:

- A) if the path isn't present, imported routes have their paths treated as `appendPaths: false`, i.e. they are not appended on to anything. Well, that's not true, it's a recursive system, so that means it may append to a parent route path (if there is one). But it won't append to anything at the `AUTH` level.

- B) if the path is present, the imported child routes are prepended, eg:

```js
AUTH: {
  path: '/auth',
  load: () => import('modules/auth'),
}
```

would produce something like: `'/auth/login'`


- C) there's a third option where the parent has a path but `appendPaths: false`, in which case, it's treated like A), eg:

```js
AUTH: {
  path: '/auth',
  appendPath: false,
  load: () => import('modules/auth'), 
}
```

So a child route for LOGIN would exist simply at `'/login'`


So in short, when the parent module path isn't used, ur basically just using the module to group routes together. So that means that modules aren't necessarily tied to a path. It's up to the user to do determine there needs. Perhaps we have a 4th option:

- C) `'something-else/login'`:

```js
AUTH: {
  path: '/auth',
  appendPath: '/something-else',
  load: () => import('modules/auth'), 
}
```

That should cover all our bases. Again, the paradigm is like ES6 modules where the responsibility is left with the parent to alias important aspects in order to prevent conflicts. That works very nicely for us.


The final thing to consider with A) above is basically we will do things like `dispatch(actions.auth.login())`

So again, we're gaining the benefits of the `auth` namespace without using it as a true parent route. ..The next thing to consider along those lines is thunks and callbacks--I guess it does still make sense to be able to assign shared callbacks even tho it doesnt have a path of its own. I.e. all children will share the same callbacks here:

```js
AUTH: {
  load: () => import('modules/auth'),
  thunk: () => ...,
}
```


The remaining question is can we do this:

`dispatch(actions.auth())`

And what happens exactly without a path? I mean the above one with a thunk would pass as a pathless route. So that means its thunk would be called, even tho the thunk is only intended for child routes. We could detect that this isn't a regular route, it's not a pathless route, it's simply a namespace *handle* by firtue of the fact that it has a `load` key but not a `path` key. Or similarly a `routes` key, but not a `path` key (in the case where code splitting isnt being used).



## Let's take a final look at how our routes map becomes our manifest:



```js
export default createModule({
  name: '345456645',
  components,
  reducers,
  routes: {
    HOME: {
      path: '/home'
    },
    CHECKOUT: {
      path: '/checkout',
      routes: {
        STEP1: {
          path: '/step-1', // final path: /checkout/step-1
        },
        STEP2: {
          path: '/step-2', // final path: /checkout/step-2
        },
        PAYMENT: {
          load: () => import('modules/stripe'),
          path: '/payment',
          appendChildPaths: false, // children dont use parent's segment, but may use grandparent etc, eg: /checkout/thank-you
          stateMappings: {
            user: 'session',
            pay: 'charge'
          }
        }
      },
    },
    AUTH: {
      load: () => import('modules/auth'), // routes that will map to the top level
      stateMappings: {
        user: 'user',
      }
    }
  },
})

// stripe module
export default createModule({
  components,
  reducers,
  routes: {
    CHARGE: {
      thunk: ({ stripe, payload }) => stripe.charge(payload)
    },
    CONFIRMATION: {
      path: '/thank-you',
    }
  }
})


// auth module
export default createModule({
  components,
  reducers,
  routes: {
    SIGNUP: {
      path: '/signup',
      action: ['customCreator'],
      customCreator
    },
    LOGIN: {
      path: '/login/:param',
      thunk: ({ api, params }) => api.fetch(params.param)
    },
    HELP: {
      path: '/help',
      appendPath: '/forgot-password', // u can speciy an alternative path to append to
      load: () => import('modules/forgotPassword'),
    }
  }
})
```


-->

```js
window.ROUTES_MANIFEST = {
  main: {
    load: () => import('modules/main'),
    routes: {
      HOME: {},
      CHECKOUT: {
        load: () => import('modules/checkout'),
        routes: {
          STEP1: {},
          STEP2: {},
          PAYMENT: {
            load: () => import('modules/stripe'),
            routes: {
              CHARGE: {},
              CONFIRMATION: {}
            }
          }
        },
      }
    }
  },
  auth: {
    load: () => import('modules/auth'),
    routes: {
      LOGIN: {},
      SIGNUP: {},
      HELP: {
        load: () => import('modules/forgotPassword')
      }
    }
  }
}
```


So the idea is that all the missing information in the manifest gets attached when the `load` imports happen. However, until then we have all the information we need to call any action in order to trigger the yet-to-be-loaded routes in the first place!



## CODE SPLITTING MIDDLEWARE (NOTHING NEW HERE YET)


This is the old code splitting middleware. 2 similar drafts.

Now, we need a new one to consider modules + nesting above. Basically this middleware along with modications to the `call` middleware + a special usage of `createScene` + of course all the babel compilation stage manifest generation will be the core of this task. We should be able to imagine the `call` + `codeSplit` middleware indepently though and get to work. coming soon...


```js
export default (name = 'load') => (api) => async (req, next) => {
  const load = req.route && req.route[name]

  if (load) { // if `route.load` does not exist short-circuit
    const parts = await load(req)
    addPartsToRuntime(req, parts)
  }

  return next()
}


const addPartsToRuntime = (req, parts) => {
  const { route, action, options, tmp, ctx, commitDispatch } = req
  const { components, reducers, chunk, ...rest } = parts

  if (ctx.chunks.includes(chunk)) return // chunk was already added to runtime, so short-circuit

  if (reducers) {
    // options.replaceReducer(reducers)
  }

  if (components) {
    req.location.components = components
    action.components = components // we need to modify `createReducer` to store `state.location.components` so after load they can be dynamically rendered within existing components!
  }

  if (tmp.committed && (components || reducers)) { // if the route change action has already been dispatched, we need to re-dispatch it again, so the new goodies are received
    action.force = true // we need a flag to force this action through, so component are added to state or new reducers receive action -- the `force` flag doesn't already exist, it's a placeholder for something we can already use to force the action passed the `isDoubleDispatch` check; we may have some other piece of infrastructure that precludes needing to create a new custom flag
    commitDispatch(action)
  }

  Object.assign(route, rest) // rest allows you to tack on additional thunks, sagas, etc, to your route object (optionally) -- i.e. you can build the "plane" (aka route) while flying
  ctx.chunks.push(chunk)
}
```
