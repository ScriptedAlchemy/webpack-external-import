# Remixx Offering Overview & Initial Implementation Spec
> **Remixx** is Redux-evolved. It's the *M* in the **MVC** approach of the **Respond Framework**.

## What is Remixx supposed to be?

Remixx solves several long-standing problems with global-state-store React development. *In order of importance here are those 3 "pillars":*

- 1) friction of "connecting" components
- 2) modularity *(the ability to drop in store-based components like regular React components)*
- 3) the Redux vs MobX debate of declarative reducers vs. imperative reactive assignment

While the last point of unifying Redux + MobX is sure to spark lots of excitement in the community, it's actually the lowest priority on our list. It could be skipped in V1 (if we had to), but it would be great marketing for us.

It's important to note that we won't be taking the the OOP approach that MobX State Tree takes, but will rather stay focused in the Redux world of pure functions. 

We imagine Redux state as a `ball` that passes through ALL components:

```js
const MyComponent = (props, state) => ....
````

We are rooted in the `App = f(state)` dream. But we aren't religious. As long as the rendering/getter phase looks just like an argument passed to components, we don't care whether "setters" are handled via the indirection of dispatched actions or imperative assignment. 

Therefore being able to assign values imperatively is an important convenience we want to offer. It's purpose is fast protoyping. E.g. to visually and quickly test if a given state yields the desired result. We think that's important because we recognize both *short term productivity* and *long term productivity*. Not one or the other. 

"Setters" generate regular redux actions containing the "paths" of accessed keys, as we'll see below.

That's the birds-eye-overview of the mobx vs redux debate. With that temporarily out of the way, let's move on to what we find most important:


## Automation instead of `connect`

The story of simplifying/removing `connect` does not start with our evolved Redux solution. It starts with how *Redux-First Router* (now called *Rudy*) already removes app-crushing bloat from the view layer. It's for that reason we'll first take a step back and see how far we've already come in order to attain a more precise view of what Remixx has remaining to remove/simplify.

Remixx is one of 2 primary/initial pillars that make up the Respond Framework. We look at the current state of React development
as a journey back towards a vastly simplified workflow that resembles server-side **MVC**. 

According to the *MVC* paradigm, we have these 3 pillars (only 2 of which we're responsible for building):

- Remixx **(model)**
- React **(view)**
- Rudy **(controller)**

Remixx--picking up where Redux left off--means that until now we have largely been focused on *MV* development without the *C*. The *M* has been severely under-developed, and the *C* non-existent within the mainstream.

Rudy--being essentially ***Redux-First Router 2.0***--has been living proof of the swiftness, dependability, and professionalism a `controller` mechanism provides. For developers that use it, it's the foundation of their "separation of concerns" approach, which extracts hefty business logic out of the *View* layer.

Traditional logic before React came around was to keep as much logic out of the view layer as possible, reducing your views to dumb templates. React turned this approach on its head. Our perspective on this is nuanced... 

The Respond Framework holds that it's important for a certain *type of logic* to exist in view components, while another type (async data fetching primarily) to live elsewhere, encompassed in an abstraction/primtive that better expresses its capabilities.

Today is not the day we get into an exhausitve weighing fo the pros and cons, but it can be summed up as this: 

- React excels at ***"vertical"*** view composition + modularity
- Rudy's route/controller primitive makes it extremely intuitive to express ***"horizontal"*** dependencies

You can think of "horizontal" dependencies like a *"segue"* in XCode, which are used to define the transition between view controllers (https://developer.apple.com/library/content/featuredarticles/ViewControllerPGforiPhoneOS/UsingSegues.html).

React by itself has no formal way to express these transitions. Instead, the mainstream approach is to stack up "smart components" (or groups of them via HOCs and render props, etc) into very heavy units of code.

Redux on the other hand has many libraries to help with this (Sagas, Observables, Redux Loop, etc). However, it's the Respond Framework's perspective that these are *too low level* and also lead to *ad hoc* spagetti. For one, they are unaware of routes, i.e. URLs. It's also our perspective that a complete state-driven solution should consider URLs from the start, just as the global state store itself. It's the coupling of all these things that streamlines development. As they say, "new product categories are created by the bundling or the unbundling of existing product categories." We are doing the "bundling," yet in a way that is modular for a modern era.

React on its own has no opinions when it comes to a global state store or URLs. Our approach is to ask this question: **"What would React look like if it considered these priorities as highly as component rendering + modularity?"**

To summarize for now, horizontal controllers/routes makes for an exceptional place/primitive to handle the never ending list of view dependencies, aka "cross cutting concerns." Here's a quick list of the problems Rudy's routes were built to solve:

- data fetching of all kinds (thunks, sagas, observables, GraphQL/Apollo)
- code splitting
- data prefetching
- chunk prefetching
- scroll restoration
- syncronization with native navigators
- communication with 3rd party analytics services
- route leave blocking/confirmation
- redirects
- server-side rendering
- server-side rendering in conjunction with code-splitting (which has been historically very challenging)
- loading states
- SEO + meta element syncing
- over-arching error handling
- deep control of sequential async tasks and the order they occur between route changes
- the list goes on...

So with the controller layer out of the way, imagine your view layer (components) far simplified. Instead of a large HOC chain (or incomprensible render-prop nesting) like this:

```js
compose(
   withRouter(/*...args*/),  // react router
   graphql(/*...args*/),     // apollo
   connect(/*...args*/),     // redux
   withState(/*...args*/)    // recompose
)(MyComponent)
```

we now have just this:

`connect(/*...args*/)(MyComponent)`

This is because our controller couples routing (React Router), domain state (Apollo/GraphQL), and even plenty of component `setState` scenarios to a **controller layer**, namely static routes. 

> On a side note, it does so through an async transition pipeline that imbues each route with powerful capabilities.

For now, let's take Rudy's capabilities and check them off as having gotten us at least half way to our goal of total code reduction.

What we are left with is still lots of work doing `mapStateToProps` and to a lesser extent `mapDispatchToProps` (mergeStatetoProps??). In short, our apps are filled with this junk, and we shouldn't have to do it *if it's possible for the computer to performantly and dependably figure it out*. By "dependably" we mean things like static typing are still available to us, and Redux's supreme testability isn't hindered.

Assuming dependability isn't our problem, perf becomes the next thing we must guarantee on the road to a frictionless DX. When we release these capabilities, rendering speed tests/comparisons must be presented. We will be relying primarily on Proxies--a capbility not taken seriously until recently. 

So we have those 2 requirements, but they are secondary. Number 1 is frictionless developer experience ("DX"). So what would that look like? Here's what we propose:

```js
const MyComponent = (props, state, actions) => {
  if (!state.loggedIn) return <Login />
  return <Dashboard foo={props.bar} user={state.user} logout={actions.logout} />
}
```

Yes, our component functions now receive 3 arguments instead of 1 (forgetting the old `context` arg for now). 

This means that Redux `state` "ball" you know and love is passed to every single component. And because our thin view layer approach, 70-90% of all components are functions rather than classes. In V1, class components will not be touched and they will be reserved for "widgets" using the old `setState` paradigm (we will discuss this later).

So this is a big win for React developers. The interface is as simple as this. There's not much more to explain about how it *looks*. Its DX gains should be obvious: developers can churn out powerful components by muscle memory alone now. The separation of concerns that controllers/routes + reducers/models provide pushes a lot of complexity elsewhere, while leaving the view-relevant parts in tact: little bits of state, which we use to conditionally render various things. And to get those "little bits of state" we just have to **use them**. If this is performantly possible with a high quality implementation, the world deserves this. This is the goal of @theKashey and @faceyspacey.

Let's move to slightly more technical implementation notes:

## Pillar 1 Implementation
### Connect Implementation 1 (components /w 3 args)

So basically the way I have imagined this--for now--is in combination with a babel plugin. So let's remove the babel plugin and look at how the above looks without it:


```js
const MyComponent = connect((props, state, actions) => {
  if (!state.loggedIn) return <Login />
  return <Dashboard foo={props.bar} user={state.user} logout={actions.logout} />
})
```

Ok, so a 5 year old could write our babel plugin...well, almost. 


### Connect Implementation 2 (babel plugin)

Basically, the .babelrc will look like this:


```js
{
  "plugins": [
    ["remixx", {
      "directories": ["components", "widgets/brand"],
      "case": "ComponentCase",
      "omit": ["MySpecialComponent"]
    }]
  ]
}
```

The idea is we will automatically transform only ComponentCased components in the given directories, with options to omit some things. By default, it will operate on the "components" folder obviously.

This allows for helper functions like `doSomething` to exist in component modules without being transformed. That's the primary takeaway for now.

### Connect Implementation 3 (connect)

```js
const connect = (Component) => class RemixxComponent extends React.Component {
    // our fancy work to subscribe to the store
    render() {
       return Component(this.props, state, actions)
    }
}
```

nuff said (for now)

### Connect Implementation 4 (subscription mechanism)

Ok, here's where we get into the nitty gritty.

Your [memoize-state](https://github.com/theKashey/memoize-state) package says:

> Memoize-state memoizes tracks **used state parts**, using the same **magic**, as you can found in MobX or immer. It will know, that it should react only on `some state.value1` change, but not `value2`. *Perfect*.

As you know, I already put this magic to great use to automatically memoize `mapStateToProps` in my prototype of `react-redux` here:

https://codesandbox.io/s/jn8l8ly85?module=%2Fsrc%2Fconnect%2FProvider.js

So our goal is to take this a step further, and track usage within `render`. You'll notice our `connect` HOC only takes a component function as an argument; no `mapState/EtcToProps`. Obviously that's because we automate this by tracking *usage* further downstream, i.e. within `render`.

Let's focus on just the `state` argument, not the `actions` argument for now (the latter is far easier and more standard--basically when you create your store you can "inject" an object containing all your actions). Here are the steps I see within our `RemixxComponent` class:

- create a `state` proxy object, which generates **"access paths"** as keys are used
- produce an array of `accessPaths` used during `render`
- in `componentDidMount` call `store.subscribe(this, accessPaths)`
- in `componentDidUpdate` possibly modify the subscription
- `store` keeps an array of all subscribed components and accessed paths, i.e: `store.subscribers = [ { instance, accessPaths }, etc ]`,
- after `store.dispatch` is called, loop through all `subscribers` and compare changed keys, and call `instance.forceUpdate()` if its used keys have changed.

> It's important to note that our subscription mechanism is the reverse of how Redux currently works where connected components are notified of all updates. Instead, the store keeps granual record of what keys components are subscribed to. And of course, as these keys change during subsequent renders, the subscribed keys must be updated

### Connect Implementation 5 (selectors)

The above only works for reducers--what about selectors?

Well--following our separation of concerns principle--you can define all your selectors when you create your store, just like reducers:

```js
const selectors = createSelectors({
  selectorName: state => state.foo,
  anotherSelector: state => state.someHash[state.selectedId]
})

const store = createStore(rootReducer, selectors)
```

So our subscription mechanism must take into consideration selectors as well.

`createSelectors` is a rough idea, but obviously you must be able to combine selectors. However, more importantly, a selector must take arguments since we no longer have `mapStateToProps`.

```js
const selectors = createSelectors({
  loggedIn: (state, userId) => state.users[userId],
})

const MyComponent = connect((props, state, actions) => {
  if (!state.loggedIn(props.userId)) return <Login />
  return <Dashboard />
})
```

It's a contrived example, but you get the idea: `props` are passed at *render time*, rather than when `react-redux`'s connect traditionally schedules the alignment.

The implementation implications are that we must also track/cache "instances" of each selector, where each "instance" is considered unique based on the arguments it receives.

Another implication is that we must in fact resolve all these `selectors` on each state change. This could be heavy! So to solve this, we only resolve/execute the selectors being used. But what if a new selector is conditionally used in `render` as a result? One solution we can try: resolve it "on the fly" the first time it's used.

> FINAL NOTE: we support namespaced selectors. Our selectors fulfill the same roles as models and computed functions in MobX State Tree. So we have this capability too:

```js
const selectors = createSelectors({
  user: {
     loggedIn: (state, userId) => state.users[userId],
     fullName: (state) => state.user.firstName + ' ' + state.user.lastName
  }
})
```
I think this solution is far simpler and more straightforward for Redux users than all that MST is doing. It's essentially an extension of `combineReducers`. We also don't need to complicate things with MST style action functions and models, as we're based in the action dispatching paradigm, which we'll call `events` and forgo all the additional unnecessary complexity Redux added with its "action creator" terminology.



# Pillar 2
### MobX style assignment

> NOTE: this is really pillar #3 in priority, but because it shares implementation similaries to #1, we will
discuss this next

What's next is we must allow `state.foo.bar = 123`. Users can do this in component event handlers, or in route thunks/callbacks (which essentially also are event handlers). They would choose to do this as a quick alternative to creating a reducer. 

What if there is a reducer for the same key in existence already? Well, they must play nice. Basically every reducer is wrapped in a generic higher order reducer that takes an action containing `access paths` and performs an assignment. This way the reducer can perform both regular reducer logic and be imperatively assigned.

When an imperative assignment like this `state.key = val` is performed, a proxy is used to transform this info into an action object. The action contains the nesting of the keys, value, etc. So ultimately our system doesn't operate very differently than standard Redux. We simply use proxies + assignments to interpret what action should be generated according to a basic format. Our reducer wrapper understands this basic format and can perform assignments, array pushes, etc, in response.

### Proxy path implementation 

The implementation is shared between pillar #1 and #2. We need a general path generation abstraction/module. The way I imagine it is an API like this:

```js
import { createPathTracker } from 'remixx/utils'

const state = createPathTracker()

state.foo.bar 
state.baz

const paths = state._getAccessedPaths() // called on componentDidMount + componentDidUpdate
console.log(paths)
// [['foo', 'bar'], ['baz']]

// example usage in a component:
const MyComponent = (props, state) => <div>{state.foo.bar}</div>
```

The internal `_getAccessedPaths` api will be re-used in multiple places:

- 1) in componentDidMount + componentDidUpdate to notify the store of subscribed keys
- 2) `state.foo.bar` must immediately return a value (unfortunately we cant do it lazily without some box like a promise); therfore after each key access, the getter returns the current accumulating path, eg: first `['foo'], then ['foo', 'bar']`, etc.
- 3) assignments utilize the same abstraction:

```js
import { createPathTracker } from 'remixx/utils'

const state = createPathTracker()

class MyComponent extends React.Component {
  increment = () => {
     this.props.foo.bar = 10
  }
  
  render() {
    return <button onClick={this.increment} />
  }
}

const Parent = (props, state) => <MyComponent foo={state.foo} />
```

So here a setter managed by the proxy generates a little data structure like this:

```js
const change = {
  path: ['foo', 'bar'],
  kind: 'assignment',
  value: 10
}
```

And we can now generate an action like this:
```js
const action = { type: 'IMPERATIVE_CHANGE', payload: change }
```

Arrays will have `push`, and we should support all common data structures + methods. 

There's also scenarios: `foo.bar += 10`. So we need to get the current value, etc.

CONCLUSION: we should have a re-usable module which provides a generic interface into this path generation work. It should be used both by state getters, state setters, and when it comes time to coordinate granular subscriptions to the store. This module itself should become its own package at some point. In other words, it should be very powerful yet super simple. Ideally it abstracts away all challenges regarding proxies. It's fine to start if we accept the limitation of `{ foo, ...spread }` as previously discussed. It's also fine if we never solve that use-case, but we should try. We can revisit this much later.


## Pillar #3

### Remixx Modules

Remixx modules is all about dynamically adding reducers to the store via `replaceReducer`, and binding components within the module to namespaced guaranteed-to-be-unique state keys.

Here's what one of our modules looks like:

```js
import { createModule } from 'remixx'

export default createmodule({
    Component: (props, state, actions) => <div>{state.user.name} <button onClick={actions.logout} /></div>,
    reducers: {
        user: (state, action) =>
            action.type === 'LOGOUT' ? null :
            action.type ==== 'DASHBOARD_COMPLETE' ? action.payload.user :
            state
    },
    routes: {
        DASHBOARD: {
            path: '/dashboard',
            thunk: async ({ api, getState }) => {
                if (!getState().user) {
                    const user = api.fetchUser()
                    return { type: 'DASHBOARD_COMPLETE', payload: { user } } // automatically dispatched by Rudy
                }
            }
        },
        LOGIN: {
            path: '/login'
        },
        LOGOUT: {
            onEnter: () => ({ type: 'LOGIN' }) // redirect to /login
        }
    }
})
```
> NOTE: actions creators + types are automatically generated by the routes in Rudy

This module can be used in multiple applications within an organization. It also could be a 3rd party package on NPM. Here's how its usage looks:

```js
import createDashboard from 'dashboard-package'

const Dashboard = createDashboard('namespaced/user') // renaming the reducer key is optional

const MyComponent = () =>
    <div>
        <Dashboard />
    </div>
```

Yes, that's all. But what it does is the important part: 

- calls `replaceReducer` on mount to inject its own reducer
- if a top level reducer already has that key name, it automatically suffixes its name like `user-hash123`
- the component can continue to refer to `state.user` instead of `state.user-hash123` or `namespaced/user`
- its actions are also suffixed/prefixed
- the route paths used are appended to the paths of parent modules (if parent modules exist)

You don't have to worry about the routes aspect for now. There is also an `actions` key in the module to specify actions, whose types will be namespaced/suffixed/prefixed. Routes is a superset of the capabilities actions provide.

### Class-based Module Interface

```js
import { ModuleComponent } from 'remixx'

class Dashboard extends ModuleComponent {
   static reducers = {}
   static routes = {}
   static actions = {}
   render(props, state, context) {}
}
```
> just a phase 2 idea for a class-based interface


### A Module that receives user/auth state as props


*Sidebar component:*
```js
import { createModule } from 'remixx'

export default createmodule({
    Component: (props, state, actions) =>
        <div>
            <h1>{props.user.name}</h1>
            <Sidebar open={state.sidebarOpen} />
            
            <button onClick={actions.open} />
            <button onClick={actions.close} />
            <button onClick={actions.toggle} />
            
            <button onClick={props.logout} />
        </div>,
    reducers: {
        sidebarOpen: (state, action) =>
            action.type === 'OPEN' ? true : action.type ==== 'CLOSE' ? false : state
    },
    actions: {
        open: { type: 'OPEN' },
        close: { type: 'CLOSE' },
        toggle: ({ getState }) => ({ type: getState().sidebarOpen ? 'CLOSE' : 'OPEN' })
    }
})
```

*usage:*
> Imagine our original `Dashboard` component definition is able to receive a child as a render prop function:
```js
import createDashboard from 'dashboard-package'
import createSidebar from './sidebar'

const Dashboard = createDashboard('namespaced/dashboard')
const Sidebar = createSidebar('namespaced/sidebar') 

const App = () => 
    <Dashboard>
        {({ user, logout }) => <Sidebar user={user} logout={logout} />}
    </Dashboard
```

So this example showcases a Remixx module within another Remixx module. The main idea is that real apps will have user auth state in parent module, or simply in top level state. Child modules therefore do not need to concern themselves with auth. They are simply passed auth related state and actions as props.

What this showcases is that Remixx modules can only access state corresponding to their own reducers. They can only dispatch their own actions. **The safeguard is that state key access and action types are namespaced.** This means if they tried to access other state or types, it wouldn't work because the namespacing with result in no matching state key or action type being available.

### Remix Modules Conclusion

There is likely more we will need to discover to finalize this approach, but its simplicity should kickstart further exploration.

The biggest challenge isn't obvious with what's above. It's this:

```js
import { createModule } from 'remixx'
import AnotherComponent from './AnotherComponent'

export default createmodule({
    Component: (props, state, actions) =>
        <div><AnotherComponent /></div>
```

*AnotherComponent.js:*

```js
export default (props, state) => <div>{state.sidebarOpen ? 'open' : 'closed' }</div>
```

The imported component needs to have access to all state + actions of the module it's imported into. In other words, how does it get access to the `namespace` provided by the application that uses the module?

My original idea was not to allow for this:
```js
const Sidebar = createSidebar('namespaced/sidebar') 
```

And instead automatically generate the namespace as a hash deterministically at compile time using a babel plugin. That however limits us to only babel plugin users. That may be fine, given babel can now compile Typescript. But ideally we find a less limiting way.

The next idea is to use the new context API to grab the hash from the closest parent. Apparently the new context API works in a way where consumers consume from the closest provider. This may work, but requires experimentation.

I think now that this is goal is written down the solution will come to us. It's an important--because Remixx modules are not just one component, but however many components you want to nest.

Another thing we need to think about is efficient propagation of state from grand parent modules to grand child modules and so on. If Remixx modules must receive all state as props, we will be essentially making them behave the old pre-redux way with lots of props passing/drilling. For example `state.user` becomes `props.user` and now the child Remixx module must do a lot of work to pass that `user` down. Should we promote use of the `context API` internally to solve this? Or should we provide an easy way to duplicate in the module's own state? How can we best automate the second option? Is there a sort of "alias" technique where the result isn't duplicate state in the store?? Perhaps we can provide an API to map the names of keys as props that the Remixx module can access directly from the redux store for efficiency. Perhaps through module-level selectors, remixx modules can select state passed from the parent as props, and make it available as its own `state` to its own nested components. ..This is the sort of question we don't need the answer to immediately; it will unveil itself at the right time after we make enough progress toward the overall goal and gain a better understanding of what the landscape looks like. *But certainly prop drilling shouldn't once again become an issue when one of the primary purposes of global state stores was to solve the prop drilling issue.* I'm confident a slick solution will come to us.


## THE END

So that's all I have for now. Hopefully this paints the complete picture. I'm sure you will discover many missing pieces. That's what this is all about. At the same time, I'm pretty happy with this 3 pillar "wish list." It's basically been in my head for a year now. The only thing missing is perhaps immer is used for reducers by default, and we forget about native js data structures and potential mistakes that can be made with forgetting to clone.

I can imagine you would like to plan the implementation more deeply. Feel free to create another `.md` adjacent to this file, and we can collaborate on it together. Once I can see your understanding of things, I can write more succinctly to communicate just the core thoughts. And eventually we can move to the most succinct option: *code*. I'm sure there are some caveats and challenges I'm unaware of regarding the usage of proxies. That's what I would love to learn about from you during this phase. You may simply want to add line comments to this file to address the most important discussion points.

Either way, just know I'm very serious about getting this done. In about 2 weeks I'll be devoting myself to it full time. My hope is you can kickstart this and we can turn it into our co-creation. Again, priority #1 (to me at least) is path access tracking to achieve *"reverse smart subscriptions."* If we can performantly eliminate all need for `mapStateToProps` and `mapDispatchToProps` (and there for `mergeProps`), we'll have accomplished a major milestone.

..and oh yea, I almost forgot, here's the general way outside of Remixx modules to supply the 3rd `actions` argument to all component functions:

`createStore(rootReducer, selectors, actions, initialState, enhancer)`

But keep in mind, Remixx modules will likely become the dominant approach, in which case `createStore` might end up just looking like this: `createStore(enhancer)`. We can keep that idea in the back of our heads. To start we shouldn't even worry about `selectors`. 

And actually, while we're on the topic of "process" and "where to start," here's what I see:

We can actually keep Redux to start, and build this simply as a replacement for `react-redux`. We'll listen to the redux store with `store.subscribe` and here our own object will compare the access paths subscribed to vs. the paths in state changed. And then trigger updates from our `connect` HOC.

I think by isolating our first goal like this and not changing Redux, we'll be able to make the fastest progress. It's basically a continuation of that condesandbox. I think we should build it as a continuation of that codesandbox because by the time we're done Suspense might be out, so that will make our lives easier then if we have to change our approach to what is inevitably coming. If we have to make it backwards compatible that will likely be easier.

This also changes one thing in the above implementation: basically all component will continue to receive all subscription events, and then within the component itself occurs the comparison of access paths to what state keys actually changed.

So this means we can keep the same subscription propagation model (well, at least the same one from the codesandbox). The only downside is that it results in a little bit more rendering work as all these components will get notified unnecessarily. However, the rendering will short-circuit after one level, and no DOM mutation will ever happen. This is a result of the new context API, but I think it's worth it if it truly does solve the render syncronization and perf issues that the old `react-redux` does far too much work to avoid.

Either way, it doesn't matter. What matters is we have a "test bed" to test our hypotheses regarding the access tracking within render. Once this is finalized, we can easily change the exact subscription transportation architecture. So let's isolate the next step removing the need for `mapStateToProps` in this demo:

https://codesandbox.io/s/jn8l8ly85?module=%2Fsrc%2Fconnect%2FProvider.js

by tracking keys during `render`. That's the goal.
