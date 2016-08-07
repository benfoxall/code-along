var target_iframe = document.querySelector('iframe')

var user_connection = (function(){
  var href = document.location.href

  if(href.indexOf('?independent') > 0) {
    return {
      type: 'independent'
    }
  }
  var match = href.match(/\?connect=(.+)/)
  if(match) {
    return {
      type: 'connect',
      target: match[1]
    }
  }

  return {
    type: 'default'
  }
})()


var showConnectionDialog = (function setup(){
    var modal = document.getElementById('connection-modal')
    var other_editor = document.getElementById('other-editor')
    var overlay = document.getElementById('connection-overlay')

    overlay.addEventListener('click', function(e){
      overlay.className = modal.className = 'hidden'
    })

    switch (user_connection.type) {
      case 'default':
        modal.children[0].className = 'current'; break
      case 'independent':
        modal.children[1].className = 'current'; break
      case 'connect':
        modal.children[2].className = 'current'; break
    }

    modal.children[0].addEventListener('click', function(e){
      e.preventDefault()
      document.location = '/'
    }, false)

    modal.children[1].addEventListener('click', function(e){
      e.preventDefault()
      document.location = '/?independent'
    })
    modal.children[2].addEventListener('click', function(e){
      e.preventDefault()
      other_editor.focus()
    })
    modal.addEventListener('submit', function(e){
      e.preventDefault()
      document.location = '/?connect=' + other_editor.value
    })

    return function showDialog(){
      modal.className = overlay.className = ''
    }
})()



// setInterval(function(){
//   target_iframe.contentWindow.postMessage({r:Math.random()}, '*')
// target_iframe.contentWindow.postMessage('asdf','*')
// }, 1000)


// initial populate
var populate = fetch('/content')
  .then(function(res){ return res.text()})
  .then(function(text){
    code.setValue(text)
  })

var pusherClient = fetch('/pusher/config')
  .then(function(res){return res.json()})
  .then(function(config){return new Pusher(config.key, config.options)})

/*
  "login" to the channel & set up store
*/
pusherClient.then(function(pusher){

  var presence = pusher.subscribe('presence-codealong')
  presence.bind('pusher:subscription_succeeded', function(e){

    var element = document.getElementById('connection-state')
    element.style.display = 'block'
    element.className = user_connection.type;
    element.innerText = ''+e.myID

    if(user_connection.type == 'connect') {
      element.innerText = e.myID + ' → ' + user_connection.target
    }

    element.href = 'javascript:showConnectionDialog()'

    // store = remoteStore(pusher, e.myID)

    store.connect(
      pusher,
      e.myID,
      '/store',
      'codealong_store'
    )
  })

})



// there are backend checks too
var isMaster = document.location.hash == '#master'


/*
  Listen for code updates
*/
if(!isMaster) {
  // not if we're pushing out as the master

  pusherClient
    .then(function(pusher){

      var channel = pusher.subscribe('codealong')

      channel.bind('update', function(action){
        console.log("update", action)

        code.setOption('readOnly', action.readOnly ? 'nocursor' : false)

        if(typeof(action.body) !== 'undefined') {
          code.setValue(action.body)
        }

      })
    })
}


/*
  Send code updates
*/

if(isMaster) {

  console.log("Master!")

  populate
    .then(function(){

      code.on('change', debounce(function(){

        console.log("putting")

        fetch('/content', {
          credentials: 'same-origin',
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            value: code.getValue()
          })
        })

      },750))

      function debounce(fn, millis, timer){
        return function(){
          clearTimeout(timer)
          timer = setTimeout(fn,millis,arguments)
        }
      }

    })

}
