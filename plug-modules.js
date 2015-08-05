;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([ 'underscore' ], factory);
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'))
  }
  else {
    // Browser globals
    root.plugModules = factory(root._);
  }
}(this, function (_) {

// Tests if an object is a Backbone collection of a certain type of Model.
var isCollectionOf = function (m, Model) {
  return Model && m instanceof Backbone.Collection && m.model === Model;
};

// Checks if the given module is a plug.dj Dialog view class.
var isDialog = function (m) {
  return m.prototype && m.prototype.className && m.prototype.className.indexOf('dialog') !== -1;
};

// Checks if two functions are "kind of similar" by comparing their source.
var functionsSeemEqual = function (a, b) {
  // ignore whitespace
  return (a + '').replace(/\s/g, '') === (b + '').replace(/\s/g, '');
};

// Checks if a function's source contains a given string.
var functionContains = function (fn, match) {
  return _.isFunction(fn) && fn.toString().indexOf(match) !== -1;
};

// Checks if a given object looks like a Backbone View class.
var isView = function (m) {
  return m.prototype && _.isFunction(m.prototype.render) && _.isFunction(m.prototype.$);
};

// Checks if a given Backbone Model class has a defaults property (plug.dj models).
var hasDefaults = function (m) {
  return m.prototype && m.prototype.defaults;
};

// Checks if an object has some set of attributes (Backbone models).
var hasAttributes = function (m, attributes) {
  return m instanceof Backbone.Model && attributes.every(function (attr) {
    return attr in m.attributes;
  })
};

// Checks if a View template contains an element matching a given CSS selector.
var viewHasElement = function (View, sel) {
  var stubEl = $('<div>');
  try {
    var x = new View({ el: stubEl });
    x.render();
    var has = x.$(sel).length > 0;
    x.remove();
    return has;
  }
  catch (e) {
    return false;
  }
};

/**
 * The Context keeps track of the long names, and provides some convenience methods
 * for working with renamed modules.
 */
function Context(target) {
  this._nameMapping = {};
  this._notFound = [];
  this._detectives = [];
  this._ran = false;
  this.target = target
  if (!target) try {
    this.target = requirejs.s.contexts._.defined;
  }
  catch (e) {
    this.target = null
  }
}
// adds a Detective to this context. these detectives will
// be run by Context#run.
Context.prototype.add = function (name, detective) {
  this._detectives.push({ name: name, detective: detective });
  return this;
};
// runs all known detectives.
Context.prototype.run = function () {
  if (this._ran) {
    return this;
  }
  var detectives = this._detectives.slice();
  // < 5000 to prevent an infinite loop if a detective's dependency was not found.
  for (var i = 0; i < detectives.length && i < 5000; i++) {
    var current = detectives[i];
    if (current.detective.isReady(this)) {
      current.detective.run(this, current.name);
    }
    else {
      // revisit later.
      detectives.push(current);
    }
  }

  this._ran = true;
  return this;
};
Context.prototype.resolveName = function (path) {
  return this._nameMapping[path] ? this.resolveName(this._nameMapping[path]) : path;
};
Context.prototype.require = function (path) {
  var defined = this.target;
  return defined[path] || (this._nameMapping[path] && this.require(this._nameMapping[path])) || undefined;
};
Context.prototype.isDefined = function (path) {
  return typeof this.require(path) !== 'undefined';
};
Context.prototype.define = function (newPath, oldPath) {
  this._nameMapping[newPath] = oldPath;
  this.require(oldPath).__plugModule = newPath
  return this;
};
Context.prototype.setNotFound = function (path) {
  this._notFound.push(path);
};
Context.prototype.getUnknownModules = function () {
  var knownModules = _.values(this._nameMapping);
  var allModules = _.keys(this.target).filter(function (moduleName) {
    return moduleName.substr(0, 5) !== 'plug/' &&
      moduleName.substr(0, 4) !== 'hbs!' &&
      this.require(moduleName) !== undefined;
  }, this);

  return _.difference(allModules, knownModules);
};
Context.prototype.isInSameNamespace = function (name, otherModuleName) {
  var otherName = this.resolveName(otherModuleName);
  return otherName && otherName.substr(0, otherName.lastIndexOf('/')) === name.substr(0, name.lastIndexOf('/'));
};
// Add the new names to the global module registry
Context.prototype.register = function () {
  for (var newName in this._nameMapping) if (this._nameMapping.hasOwnProperty(newName)) {
    this.target[newName] = this.require(newName);
  }
};

/**
 * A Detective finds a specific module definition.
 */
function Detective() {
  this._needs = [];
}
// Define dependencies. This ensures that this Detective will only run
// once the given modules have been found.
Detective.prototype.needs = function () {
  this._needs = this._needs.concat(Array.prototype.slice.call(arguments));
  return this;
};
Detective.prototype.isReady = function (context) {
  return this._needs.every(function (name) {
    return context.isDefined(name);
  });
};
Detective.prototype.resolve = function () {
  throw new Error('Engineer "resolve" method not implemented');
};
Detective.prototype.run = function (context, newName) {
  var oldName = this.resolve(context);
  if (oldName) {
    context.define(newName, oldName);
    return true;
  }
  context.setNotFound(newName);
  return false;
};

/**
 * A Matcher finds a module definition by checking every available
 * module definition until it matches.
 */
function Matcher() {
  Detective.call(this);
}
Matcher.prototype = Object.create(Detective.prototype);
Matcher.prototype.match = function (context, module, name) {
  throw new Error('Matcher "match" method not implemented');
};
Matcher.prototype.resolve = function (context) {
  var defines = context.target;
  var fn = this.fn;
  for (var name in defines) if (defines.hasOwnProperty(name)) {
    try {
      if (defines[name] && !defines[name].__plugModule &&
          this.match(context, defines[name], name)) {
        return name;
      }
    }
    catch (e) {}
  }
};
Matcher.prototype.and = function (matcher) {
  if (!(matcher instanceof Matcher)) {
    matcher = new SimpleMatcher(matcher);
  }
  return new AndMatcher(this, matcher);
};

/**
 * A Fetcher finds a module definition by itself. Usually it will use other, known, modules
 * and "navigate" to a place that references target module.
 */
function Fetcher() {
  Detective.call(this);
}
Fetcher.prototype = Object.create(Detective.prototype);
Fetcher.prototype.resolve = function (context) {
  var module = this.fetch(context);
  if (module) {
    // find module name
    var defines = context.target,
      name;
    for (name in defines) if (defines.hasOwnProperty(name)) {
      if (defines[name] && defines[name] === module) {
        return name;
      }
    }
  }
}

/**
 * A SimpleMatcher finds a module definition that matches a function.
 */
function SimpleMatcher(fn) {
  Matcher.call(this);

  this._fn = fn;
}
SimpleMatcher.prototype = Object.create(Matcher.prototype);
SimpleMatcher.prototype.match = function (context, module, name) {
  if (!this._fn) {
    throw new Error('No function passed to SimpleMatcher.');
  }
  return this._fn.call(context, module, name);
};

/**
 * A StepwiseMatcher finds a module definition that matches a function.
 * Some setup and cleanup can be done around the matcher, for example
 * to set up some mutations that you can use to detect the right definition.
 */
function StepwiseMatcher(steps) {
  SimpleMatcher.call(this, steps.check);

  this._setup = steps.setup;
  this._cleanup = steps.cleanup;
}
StepwiseMatcher.prototype = Object.create(SimpleMatcher.prototype);
StepwiseMatcher.prototype.resolve = function (context) {
  // step 1: setup
  this._setup.call(context);
  // step 2: run checks
  var name = SimpleMatcher.prototype.resolve.call(this, context);
  // step 3: cleanup
  this._cleanup.call(context, context.require(name), name);
  return name;
};

/**
 * An AndMatcher finds a module definition that matches two other Matchers.
 */
function AndMatcher(a, b) {
  Matcher.call(this);

  if (a._needs) this.needs.apply(this, a._needs);
  if (b._needs) this.needs.apply(this, b._needs);

  this.a = a;
  this.b = b;
}
AndMatcher.prototype = Object.create(Matcher.prototype);
AndMatcher.prototype.match = function (context, module, name) {
  return this.a.match(context, module, name) && this.b.match(context, module, name);
};

/**
 * An EventMatcher finds a module definition for a specific kind of Event.
 */
function EventMatcher(name) {
  Matcher.call(this);

  this._name = name;
}
EventMatcher.prototype = Object.create(Matcher.prototype);
EventMatcher.prototype.match = function (context, module, name) {
  return module._name === this._name;
};

/**
 * An ActionMatcher finds a module definition that defines a certain plug.dj Action.
 */
function ActionMatcher(method, url, regex, params) {
  Matcher.call(this);

  this._method = method.toUpperCase();
  this._url = url;
  this._regex = regex;
  this._params = params || [];
  this._fakeInstance = {};
  Object.defineProperty(this._fakeInstance, '_super', {
    get: function () {
      // fake _super method
      return function () {};
    },
    set: function () {
      // ignore
    }
  });
}
ActionMatcher.prototype = Object.create(Matcher.prototype);
ActionMatcher.prototype.match = function (context, module, name) {
  if (module.prototype && module.prototype.type === this._method) {
    if (this._url) {
      return module.prototype.route === this._url;
    }
    else if (this._regex) {
      module.prototype.init.apply(this._fakeInstance, this._params);
      return this._fakeInstance.route && (
        typeof this._regex === 'string'
        ? this._fakeInstance.route.indexOf(this._regex) === 0
        : this._regex.test(this._fakeInstance.route)
      );
    }
  }
  return false;
};

/**
 * A SimpleFetcher allows a given function to find a module definition.
 */
function SimpleFetcher(fn) {
  Detective.call(this);

  this._fetch = fn;
}
SimpleFetcher.prototype = Object.create(Fetcher.prototype);
SimpleFetcher.prototype.fetch = function (context) {
  return this._fetch.call(context);
};

/**
 * A HandlerFetcher finds a module definition of a plug.dj Event Handler that handles a specific event.
 */
function HandlerFetcher(eventName) {
  Detective.call(this);

  this._eventName = eventName;
  this.needs('plug/core/EventManager');
}
HandlerFetcher.prototype = Object.create(Fetcher.prototype);
HandlerFetcher.prototype.fetch = function (context) {
  var events = context.require('plug/core/EventManager').eventTypeMap;
  if (!events) return false;
  var eventTypes = events[this._eventName];
  // Luckily for us, none of the events have multiple handlers at the moment!
  return eventTypes && eventTypes[0];
};

/**
 * Map improvised module name → module matcher. (that hopefully matches only the right module!)
 * This is quite brittle because Plug.DJ can change their internals at any given moment, but
 * it sort of works!
 */
var plugModules = {

  'plug/actions/Action': function (m) {
    return m.prototype && _.isFunction(m.prototype.alert) && _.isFunction(m.prototype.permissionAlert);
  },
  'plug/actions/actionQueue': function (m) {
    return _.isArray(m.queue) && _.isFunction(m.add) && _.isFunction(m.append) &&
      _.isFunction(m.next) && _.isFunction(m.complete);
  },

  'plug/actions/auth/AuthResetAction': new ActionMatcher('POST', 'auth/reset/me'),
  'plug/actions/auth/AuthTokenAction': new ActionMatcher('GET', 'auth/token'),
  'plug/actions/auth/FacebookAuthAction': new ActionMatcher('POST', 'auth/facebook'),
  'plug/actions/auth/KillSessionAction': new ActionMatcher('DELETE', 'auth/session'),
  'plug/actions/auth/LoginAction': new ActionMatcher('POST', 'auth/login'),
  'plug/actions/bans/BanAction': new ActionMatcher('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': new ActionMatcher('GET', 'bans'),
  'plug/actions/bans/UnbanAction': new ActionMatcher('DELETE', null, 'bans/'),
  'plug/actions/booth/JoinWaitlistAction': new ActionMatcher('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': new ActionMatcher('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': new ActionMatcher('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': new ActionMatcher('POST', 'booth/skip'),
  'plug/actions/booth/ModerateRemoveDJAction': new ActionMatcher('DELETE', null, 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': new ActionMatcher('POST', 'booth/skip/me'),
  'plug/actions/booth/BoothLockAction': new ActionMatcher('PUT', 'booth/lock'),
  'plug/actions/booth/BoothMoveAction': new ActionMatcher('POST', 'booth/move'),
  'plug/actions/booth/BoothSetCycleAction': new ActionMatcher('PUT', 'booth/cycle'),
  'plug/actions/friends/BefriendAction': new ActionMatcher('POST', 'friends'),
  'plug/actions/friends/ListFriendsAction': new ActionMatcher('GET', 'friends'),
  'plug/actions/friends/ListInvitesAction': new ActionMatcher('GET', 'friends/invites'),
  'plug/actions/friends/IgnoreRequestAction': new ActionMatcher('PUT', 'friends/ignore'),
  'plug/actions/friends/UnfriendAction': new ActionMatcher('DELETE', null, 'friends/'),
  'plug/actions/ignores/IgnoreAction': new ActionMatcher('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': new ActionMatcher('DELETE', null, 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': new ActionMatcher('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': new ActionMatcher('GET', null, 'playlists/'),
  'plug/actions/media/MediaDeleteAction': new ActionMatcher('POST', null, /\/media\/delete$/),
  'plug/actions/media/MediaGrabAction': new ActionMatcher('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': new ActionMatcher('POST', null, /\/media\/insert$/, [ null, [], null ]),
  'plug/actions/media/MediaMoveAction': new ActionMatcher('PUT', null, /\/media\/move$/, [ null, [], null ]),
  'plug/actions/media/MediaUpdateAction': new ActionMatcher('PUT', null, /\/media\/update$/),
  'plug/actions/mutes/MuteAction': new ActionMatcher('POST', 'mutes'),
  'plug/actions/mutes/UnmuteAction': new ActionMatcher('DELETE', null, 'mutes/'),
  'plug/actions/mutes/MutesListAction': new ActionMatcher('GET', 'mutes'),
  'plug/actions/news/NewsListAction': new ActionMatcher('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': new ActionMatcher('DELETE', null, 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': new ActionMatcher('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': new ActionMatcher('PUT', null, /\/activate$/),
  'plug/actions/playlists/PlaylistCreateAction': new ActionMatcher('POST', 'playlists'),
  'plug/actions/playlists/PlaylistDeleteAction': new ActionMatcher('DELETE', null, 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': new ActionMatcher('PUT', null, /\/rename$/),
  'plug/actions/playlists/PlaylistShuffleAction': new ActionMatcher('PUT', null, /\/shuffle$/),
  'plug/actions/profile/SetBlurbAction': new ActionMatcher('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': new ActionMatcher('GET', null, 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': new ActionMatcher('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': new ActionMatcher('GET', null, 'rooms?q='),
  'plug/actions/rooms/ModerateDeleteChatAction': new ActionMatcher('DELETE', null, 'chat/'),
  'plug/actions/rooms/RoomCreateAction': new ActionMatcher('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': new ActionMatcher('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': new ActionMatcher('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': new ActionMatcher('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': new ActionMatcher('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': new ActionMatcher('DELETE', null, 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': new ActionMatcher('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': new ActionMatcher('GET', null, 'rooms/validate'),
  'plug/actions/rooms/SOSAction': new ActionMatcher('POST', 'rooms/sos'),
  'plug/actions/rooms/VoteAction': new ActionMatcher('POST', 'votes'),
  'plug/actions/soundcloud/SoundCloudSearchService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onResolve) && _.isFunction(m.prototype.parse);
  },
  'plug/actions/soundcloud/SoundCloudFavoritesService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/favorites');
  },
  'plug/actions/soundcloud/SoundCloudTracksService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/tracks');
  },
  'plug/actions/soundcloud/SoundCloudSetsService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/playlists');
  },
  'plug/actions/soundcloud/SoundCloudPermalinkService': function (m) {
    return _.isFunction(m) && functionContains(m.prototype.load, 'api.soundcloud.com/tracks') &&
      !functionContains(m.prototype.onError, 'Search') &&
      _.isFunction(m.prototype.onComplete);
  },
  'plug/actions/staff/StaffListAction': new ActionMatcher('GET', 'staff'),
  'plug/actions/staff/StaffRemoveAction': new ActionMatcher('DELETE', null, 'staff/'),
  'plug/actions/staff/StaffUpdateAction': new ActionMatcher('POST', 'staff/update'),
  'plug/actions/store/ChangeUsernameAction': new ActionMatcher('POST', 'store/purchase/username'),
  'plug/actions/store/PurchaseAction': new ActionMatcher('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': new ActionMatcher('GET', null, 'store/products'),
  'plug/actions/store/InventoryAction': new ActionMatcher('GET', null, 'store/inventory'),
  'plug/actions/users/ValidateNameAction': new ActionMatcher('GET', null, 'users/validate/'),
  'plug/actions/users/SetLanguageAction': new ActionMatcher('PUT', 'users/language'),
  'plug/actions/users/SetAvatarAction': new ActionMatcher('PUT', 'users/avatar'),
  'plug/actions/users/SetBadgeAction': new ActionMatcher('PUT', 'users/badge'),
  'plug/actions/users/MeAction': new ActionMatcher('GET', 'users/me'),
  'plug/actions/users/ListTransactionsAction': new ActionMatcher('GET', 'users/me/transactions'),
  'plug/actions/users/UserHistoryAction': new ActionMatcher('GET', 'users/me/history'),
  'plug/actions/users/UserFindAction': new ActionMatcher('GET', null, 'users/'),
  'plug/actions/users/BulkFindAction': new ActionMatcher('POST', 'users/bulk'),
  'plug/actions/users/SendGiftAction': new ActionMatcher('POST', 'gift'),
  'plug/actions/users/SaveSettingsAction': new ActionMatcher('PUT', 'users/settings'),
  'plug/actions/users/SignupAction': new ActionMatcher('POST', 'users/signup'),
  'plug/actions/youtube/YouTubePlaylistService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.sortByName) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeImportService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.getURL) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeSearchService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos);
  },
  'plug/actions/youtube/YouTubeSuggestService': function (m) {
    return _.isFunction(m) && functionContains(m.prototype.load, 'google.com/complete/search');
  },

  'plug/core/EventManager': function (m) {
    return _.isObject(m.eventTypeMap) && _.isObject(m.commandClassMap._map);
  },
  'plug/core/Events': function (m) {
    return _.isFunction(m.dispatch) && m.dispatch.length === 1;
  },
  'plug/core/Class': function (m) {
    return _.isFunction(m) && _.isFunction(m.extend) && functionsSeemEqual(m, function () {});
  },
  'plug/core/EventHandler': function (m) {
    return _.isFunction(m) && m.prototype &&
           _.isFunction(m.prototype.dispatch) &&
           _.isFunction(m.prototype.trigger) &&
           _.isFunction(m.prototype.execute) &&
           // this is a bit lame, unfortunately plug.dj's "classes" don't publicly store their superclasses
           functionsSeemEqual(m.prototype.execute, function () { this.event = undefined, delete this.event });
  },
  'plug/core/AsyncHandler': function (m) {
    // subclass of EventHandler
    return _.isFunction(m) && m.prototype.hasOwnProperty('listenTo') && m.prototype.hasOwnProperty('finish');
  },

  'plug/store/settings': function (m) {
    return _.isObject(m.settings);
  },
  'plug/store/media': function (m) {
    return _.isFunction(m.deleteOrphans);
  },
  'plug/store/compress': function (m) {
    return _.isFunction(m.compress);
  },

  'plug/lang/Lang': function (m) {
    return 'alerts' in m && 'addedToPlaylist' in m.alerts;
  },

  'plug/util/analytics': function (m) {
    return _.isFunction(m.identify);
  },
  'plug/util/API': function (m) {
    return 'WAIT_LIST_UPDATE' in m && 'CHAT_COMMAND' in m ;
  },
  'plug/util/audienceGrid': function (m) {
    return _.isFunction(m.defaultInvalidation) && _.isFunction(m.invalidateRoomElements);
  },
  'plug/util/AvatarManifest': function (m) {
    return _.isFunction(m.getAvatarUrl) && _.isFunction(m.getHitSlot);
  },
  'plug/util/comparators': function (m) {
    return _.isFunction(m.uIndex) && _.isFunction(m.priority);
  },
  'plug/util/DateTime': function (m) {
    return _.isFunction(m.ServerDate);
  },
  'plug/util/Dictionary': function (m) {
    return m.prototype && m.prototype._map === null && _.isFunction(m.prototype.adopt);
  },
  'plug/util/emoji': function (m) {
    return _.isFunction(m.emojify) && m.map && 'shipit' in m.map;
  },
  'plug/util/Environment': function (m) {
    return 'isChrome' in m && 'isAndroid' in m;
  },
  'plug/util/Random': function (m) {
    return _.isFunction(m) && m.MASTER instanceof m && _.isFunction(m.MASTER.newSeed);
  },
  'plug/util/soundCloudSdkLoader': function (m) {
    return _.isFunction(m.g) && _.isString(m.id);
  },
  'plug/util/twitterWidgetLoader': function (m) {
    return m.f && _.isFunction(m.i);
  },
  'plug/util/urls': function (m) {
    return 'csspopout' in m && 'scThumbnail' in m;
  },
  'plug/util/userSuggestion': function (m) {
    return _.isArray(m.groups) && _.isFunction(m.initGroups) && _.isFunction(m.lookup);
  },
  'plug/util/util': function (m) {
    return _.isFunction(m.h2t);
  },
  'plug/util/window': function (m) {
    return 'PLAYLIST_OFFSET' in m;
  },

  'plug/server/request': function (m) {
    return !_.isFunction(m) && _.isFunction(m.execute) &&
      functionContains(m.execute, 'application/json');
  },
  'plug/server/socketReceiver': function (m) {
    return _.isFunction(m.ack) && _.isFunction(m.plugUpdate);
  },

  'plug/events/Event': new EventMatcher('Event'),
  'plug/events/AlertEvent': new EventMatcher('AlertEvent'),
  'plug/events/ChatFacadeEvent': new EventMatcher('ChatFacadeEvent'),
  'plug/events/CustomRoomEvent': new EventMatcher('CustomRoomEvent'),
  'plug/events/DJEvent': new EventMatcher('DJEvent'),
  'plug/events/FacebookLoginEvent': new EventMatcher('FacebookLoginEvent'),
  'plug/events/FriendEvent': new EventMatcher('UserEvent').and(function (m) {
    return m.ACCEPT === 'UserEvent:accept' && m.UNFRIEND === 'UserEvent:unfriend';
  }),
  'plug/events/HistorySyncEvent': new EventMatcher('HistorySyncEvent'),
  'plug/events/ImportSoundCloudEvent': new EventMatcher('ImportSoundCloudEvent'),
  'plug/events/ImportYouTubeEvent': new EventMatcher('ImportYouTubeEvent'),
  'plug/events/MediaActionEvent': new EventMatcher('MediaActionEvent'),
  'plug/events/MediaDeleteEvent': new EventMatcher('MediaDeleteEvent'),
  'plug/events/MediaGrabEvent': new EventMatcher('MediaGrabEvent'),
  'plug/events/MediaInsertEvent': new EventMatcher('MediaInsertEvent'),
  'plug/events/MediaMoveEvent': new EventMatcher('MediaMoveEvent'),
  'plug/events/MediaUpdateEvent': new EventMatcher('MediaUpdateEvent'),
  'plug/events/ModerateEvent': new EventMatcher('ModerateEvent'),
  'plug/events/PlaylistActionEvent': new EventMatcher('PlaylistActionEvent'),
  'plug/events/PlaylistCreateEvent': new EventMatcher('PlaylistCreateEvent'),
  'plug/events/PlaylistDeleteEvent': new EventMatcher('PlaylistDeleteEvent'),
  'plug/events/PlaylistRenameEvent': new EventMatcher('PlaylistRenameEvent'),
  'plug/events/PlayMediaEvent': new EventMatcher('PlayMediaEvent'),
  'plug/events/PreviewEvent': new EventMatcher('PreviewEvent'),
  'plug/events/RelatedBackEvent': new EventMatcher('RelatedBackEvent'),
  'plug/events/RestrictedSearchEvent': new EventMatcher('RestrictedSearchEvent'),
  'plug/events/RoomCreateEvent': new EventMatcher('RoomCreateEvent'),
  'plug/events/RoomEvent': new EventMatcher('RoomEvent'),
  'plug/events/ShowDialogEvent': new EventMatcher('ShowDialogEvent'),
  'plug/events/ShowUserRolloverEvent': new EventMatcher('ShowUserRolloverEvent'),
  'plug/events/StoreEvent': new EventMatcher('StoreEvent'),
  'plug/events/UserEvent': new EventMatcher('UserEvent').and(function (m) {
    return m.FRIENDS === 'UserEvent:friends' && m.PRESENCE === 'UserEvent:presence';
  }),
  'plug/events/UserListEvent': new EventMatcher('UserListEvent'),

  'plug/handlers/AlertHandler': new HandlerFetcher('AlertEvent:alert'),
  'plug/handlers/AvatarPurchaseHandler': new HandlerFetcher('StoreEvent:purchaseAvatar'),
  'plug/handlers/BadgePurchaseHandler': new HandlerFetcher('StoreEvent:purchaseBadge'),
  'plug/handlers/BoostPurchaseHandler': new HandlerFetcher('StoreEvent:purchaseBoost'),
  'plug/handlers/CustomRoomHandler': new HandlerFetcher('CustomRoomEvent:custom'),
  'plug/handlers/DJHandler': new HandlerFetcher('DJEvent:join'),
  'plug/handlers/FacebookLoginHandler': new HandlerFetcher('FacebookLoginEvent:login'),
  'plug/handlers/FriendHandler': new HandlerFetcher('UserEvent:accept'),
  'plug/handlers/GrabHandler': new HandlerFetcher('MediaGrabEvent:grab'),
  'plug/handlers/ImportSoundCloudHandler': new HandlerFetcher('ImportSoundCloudEvent:sets'),
  'plug/handlers/ImportYouTubeHandler': new HandlerFetcher('ImportYouTubeEvent:import'),
  'plug/handlers/ListBansHandler': new HandlerFetcher('UserListEvent:bans'),
  'plug/handlers/ListFriendsHandler': new HandlerFetcher('UserEvent:friends'),
  'plug/handlers/ListIgnoresHandler': new HandlerFetcher('UserListEvent:ignored'),
  'plug/handlers/ListInvitesHandler': new HandlerFetcher('UserEvent:invites'),
  'plug/handlers/ListMutesHandler': new HandlerFetcher('UserListEvent:mutes'),
  'plug/handlers/ListPlaylistsHandler': new HandlerFetcher('PlaylistActionEvent:sync'),
  'plug/handlers/ListStaffHandler': new HandlerFetcher('UserListEvent:staff'),
  'plug/handlers/MediaDeleteHandler': new HandlerFetcher('MediaDeleteEvent:delete'),
  'plug/handlers/MediaHandler': new HandlerFetcher('MediaActionEvent:add'),
  'plug/handlers/MediaInsertHandler': new HandlerFetcher('MediaInsertEvent:insert'),
  'plug/handlers/MediaMoveHandler': new HandlerFetcher('MediaMoveEvent:move'),
  'plug/handlers/MediaPlayHandler': new HandlerFetcher('PlayMediaEvent:play'),
  'plug/handlers/MediaUpdateHandler': new HandlerFetcher('MediaUpdateEvent:update'),
  'plug/handlers/ModerateHandler': new HandlerFetcher('ModerateEvent:skip'),
  'plug/handlers/NameChangeHandler': new HandlerFetcher('StoreEvent:purchaseName'),
  'plug/handlers/PlaylistActivateHandler': new HandlerFetcher('PlaylistActionEvent:activate'),
  'plug/handlers/PlaylistCreateHandler': new HandlerFetcher('PlaylistCreateEvent:create'),
  'plug/handlers/PlaylistDeleteHandler': new HandlerFetcher('PlaylistDeleteEvent:delete'),
  'plug/handlers/PlaylistLoadHandler': new HandlerFetcher('PlaylistActionEvent:load'),
  'plug/handlers/PlaylistRenameHandler': new HandlerFetcher('PlaylistRenameEvent:rename'),
  'plug/handlers/PlaylistUpdateHandler': new HandlerFetcher('PlaylistActionEvent:rename'),
  'plug/handlers/PreviewHandler': new HandlerFetcher('PreviewEvent:preview'),
  'plug/handlers/RelatedBackHandler': new HandlerFetcher('RelatedBackEvent:back'),
  'plug/handlers/RestrictedSearchHandler': new HandlerFetcher('RestrictedSearchEvent:search'),
  'plug/handlers/RoomCreateHandler': new HandlerFetcher('RoomCreateEvent:create'),
  'plug/handlers/RoomHistoryHandler': new HandlerFetcher('HistorySyncEvent:room'),
  'plug/handlers/RoomJoinHandler': new HandlerFetcher('RoomEvent:join'),
  'plug/handlers/RoomStateHandler': new HandlerFetcher('RoomEvent:state'),
  'plug/handlers/StoreAvatarsHandler': new HandlerFetcher('StoreEvent:storeAvatars'),
  'plug/handlers/StoreBadgesHandler': new HandlerFetcher('StoreEvent:storeBadges'),
  'plug/handlers/StoreMiscHandler': new HandlerFetcher('StoreEvent:storeMisc'),
  'plug/handlers/StoreTransactionsHandler': new HandlerFetcher('StoreEvent:userTransactions'),
  'plug/handlers/UnbanHandler': new HandlerFetcher('ModerateEvent:unban'),
  'plug/handlers/UnmuteHandler': new HandlerFetcher('ModerateEvent:unmute'),
  'plug/handlers/UserAvatarsHandler': new HandlerFetcher('StoreEvent:userAvatars'),
  'plug/handlers/UserBadgesHandler': new HandlerFetcher('StoreEvent:userBadges'),
  'plug/handlers/UserHistoryHandler': new HandlerFetcher('HistorySyncEvent:user'),
  'plug/handlers/UserMeHandler': new HandlerFetcher('UserEvent:me'),
  'plug/handlers/UserRolloverHandler': new HandlerFetcher('ShowUserRolloverEvent:show'),

  'plug/models/Avatar': function (m) {
    return m.AUDIENCE && m.DJ && _.isObject(m.IMAGES);
  },
  'plug/models/Badge': function (m) {
    return hasDefaults(m) && 'level' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('category' in m.prototype.defaults) && 'active' in m.prototype.defaults;
  },
  'plug/models/BannedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'duration' in m.prototype.defaults;
  },
  'plug/models/booth': function (m) {
    return hasAttributes(m, [ 'isLocked', 'shouldCycle' ]);
  },
  'plug/models/currentMedia': function (m) {
    return _.isFunction(m.onMediaChange) && _.isFunction(m.onStartTimeChange);
  },
  'plug/models/currentRoom': function (m) {
    return m instanceof Backbone.Model && _.isArray(m.get('fx'));
  },
  'plug/models/currentScore': function (m) {
    return _.isFunction(m.vote) && _.isFunction(m.grab) && _.isFunction(m.advance);
  },
  'plug/models/currentUser': function (m) {
    return _.isArray(m._l) && _.isArray(m._x);
  },
  'plug/models/HistoryEntry': function (m) {
    return hasDefaults(m) && 'timestamp' in m.prototype.defaults && 'score' in m.prototype.defaults;
  },
  'plug/models/Media': function (m) {
    return hasDefaults(m) && 'cid' in m.prototype.defaults && 'format' in m.prototype.defaults;
  },
  'plug/models/MediaSearchResult': function (m) {
    return hasDefaults(m) && 'media' in m.prototype.defaults && 'playlist' in m.prototype.defaults;
  },
  'plug/models/MutedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'expires' in m.prototype.defaults;
  },
  'plug/models/Notification': function (m) {
    return hasDefaults(m) && 'action' in m.prototype.defaults && 'value' in m.prototype.defaults;
  },
  'plug/models/Playlist': function (m) {
    return hasDefaults(m) && 'active' in m.prototype.defaults && 'syncing' in m.prototype.defaults;
  },
  'plug/models/Room': function (m) {
    return hasDefaults(m) && 'slug' in m.prototype.defaults && 'capacity' in m.prototype.defaults;
  },
  'plug/models/SoundCloudPlaylist': function (m) {
    return hasDefaults(m) && 'title' in m.prototype.defaults && 'tracks' in m.prototype.defaults;
  },
  'plug/models/StoreExtra': function (m) {
    return hasDefaults(m) && 'category' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('active' in m.prototype.defaults);
  },
  'plug/models/Transaction': function (m) {
    return hasDefaults(m) && 'type' in m.prototype.defaults && 'item' in m.prototype.defaults;
  },
  'plug/models/User': function (m) {
    return hasDefaults(m) && 'avatarID' in m.prototype.defaults && 'role' in m.prototype.defaults;
  },
  'plug/models/YouTubePlaylist': function (m) {
    return hasDefaults(m) && 'playlistID' in m.prototype.defaults && 'username' in m.prototype.defaults;
  },
  'plug/models/relatedSearch': function (m) {
    return hasAttributes(m, [ 'related', 'relatedPlaylist' ]);
  },

  'plug/collections/allAvatars': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.__generate);
  },
  'plug/collections/bannedUsers': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/BannedUser'));
  }).needs('plug/models/BannedUser'),
  'plug/collections/currentPlaylist': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Media')) &&
      m._events && 'update:next' in m._events;
  }).needs('plug/models/Media'),
  'plug/collections/currentPlaylistFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Media')) &&
      _.isFunction(m.setFilter) && _.isFunction(m.isActualFirst);
  }).needs('plug/models/Media'),
  'plug/collections/dashboardRooms': new SimpleMatcher(function (m) {
    if (!isCollectionOf(m, this.require('plug/models/Room'))) {
      return false;
    }
    // the dashboardRooms collection has its own comparator that we can check!
    var fakeRoomA = { get: function (key) { return key === 'population' ? 10 : 'a'; } },
        fakeRoomB = { get: function (key) { return key === 'population' ? 10 : 'b'; } },
        fakeRoomC = { get: function (key) { return key === 'population' ? 20 : 'c'; } };
    return functionContains(m.comparator, 'population') &&
      functionContains(m.comparator, 'name') &&
      m.comparator(fakeRoomA, fakeRoomB) === 1 &&
      m.comparator(fakeRoomC, fakeRoomB) === -1;
  }).needs('plug/models/Room'),
  'plug/collections/friendRequests': new SimpleFetcher(function () {
    var FriendRequestsView = this.require('plug/views/users/friends/FriendRequestsView');
    return FriendRequestsView.prototype.collection;
  }).needs('plug/views/users/friends/FriendRequestsView'),
  'plug/collections/friends': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      _.isFunction(m.onUsersAdd) &&
      _.isFunction(m.lookup) &&
      _.isFunction(m.onRemove) &&
      _.isFunction(m.onAdd) &&
      'MAX' in m.constructor;
  }).needs('plug/models/User'),
  'plug/collections/friendsFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      _.isFunction(m.setFilter) &&
      m.comparator === 'uIndex' &&
      // usersFiltered has a sourceCollection
      !('sourceCollection' in m);
  }).needs('plug/models/User'),
  'plug/collections/history': new SimpleFetcher(function () {
    var RoomHistoryHandler = this.require('plug/handlers/RoomHistoryHandler');
    return RoomHistoryHandler.prototype.collection;
  }).needs('plug/handlers/RoomHistoryHandler'),
  'plug/collections/ignores': new StepwiseMatcher({
    // The IgnoreAction puts the received data in the `ignores` collection in the
    // `parse` method. So here we pretend to have a new ignore, add it to the collection,
    // and then find which collection was changed.
    setup: function () {
      var IgnoreAction = this.require('plug/actions/ignores/IgnoreAction');
      var User = this.require('plug/models/User')
      IgnoreAction.prototype.parse.call(
        // fake context with an empty trigger function to
        // 1) prevent an error, and
        // 2) not show the notification box that this would otherwise show.
        { trigger: function () {} },
        // fake "response"
        { code: 200, data: [ { id: -1000, username: '__test__' } ] }
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/User')) &&
        m.comparator === 'username' &&
        m.length > 0 && m.last().get('id') === -1000;
    },
    cleanup: function (ignores) {
      // get rid of the fake user
      ignores.pop();
    }
  }).needs('plug/models/User', 'plug/actions/ignores/IgnoreAction'),
  'plug/collections/mutes': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/MutedUser'));
  }).needs('plug/models/MutedUser'),
  'plug/collections/myAvatars': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Avatar')) && _.isFunction(m.onChange);
  }).needs('plug/models/Avatar'),
  'plug/collections/myBadges': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Badge')) && _.isFunction(m.onChange);
  }).needs('plug/models/Badge'),
  'plug/collections/notifications': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Notification'));
  }).needs('plug/models/Notification'),
  'plug/collections/playlists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Playlist')) &&
      _.isFunction(m.jumpToMedia) && _.isArray(m.activeMedia);
  }).needs('plug/models/Playlist'),
  'plug/collections/playlistSearchResults': new SimpleMatcher(function (m) {
    // playlist search doesn't actually exist right now, but the models
    // are there on the client side!
    return isCollectionOf(m, this.require('plug/models/MediaSearchResult'));
  }).needs('plug/models/MediaSearchResult'),
  'plug/collections/purchasableAvatars': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Avatar')) &&
      !_.isFunction(m.__generate) && // allAvatars
      !_.isFunction(m.onChange); // myAvatars
  }).needs('plug/models/Avatar'),
  'plug/collections/purchasableBadges': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Badge')) &&
      !_.isFunction(m.onChange); // myBadges
  }).needs('plug/models/Badge'),
  'plug/collections/restrictedMediaAlternatives': new StepwiseMatcher({
    setup: function () {
      var RSHandler = this.require('plug/handlers/RestrictedSearchHandler');
      // the restricted search result handler resets the searchResults
      // array
      RSHandler.prototype.onResult.call(
        { finish: function () {} },
        [ {
          id: -1000,
          author: 'plug-modules',
          title: 'Test item used to find the right collection.'
        } ]
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/Media')) &&
        m.length > 0 &&
        m.last().get('id') === -1000;
    },
    cleanup: function (searchResults) {
      // we cannot get back the original search results, unfortunately,
      // without re-running the search query (which may be possible, but
      // is a little expensive)
    }
  }).needs('plug/handlers/RestrictedSearchHandler', 'plug/models/Media'),
  'plug/collections/relatedMedia': new SimpleMatcher(function (m) {
    // TODO
    return isCollectionOf(m, this.require('plug/models/Media')) && false;
  }).needs('plug/models/Media'),
  'plug/collections/soundCloudPlaylists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/SoundCloudPlaylist'));
  }).needs('plug/models/SoundCloudPlaylist'),
  // staff is only updated when a StaffListAction is triggered
  // eg. when the user navigates to the staff tab
  'plug/collections/staff': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      m.comparator === this.require('plug/util/comparators').staff;
  }).needs('plug/models/User', 'plug/util/comparators'),
  'plug/collections/staffFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) && _.isFunction(m.setFilter) &&
      !('sourceCollection' in m);
  }).needs('plug/models/User'),
  'plug/collections/storeExtras': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/StoreExtra'));
  }).needs('plug/models/StoreExtra'),
  'plug/collections/transactions': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Transaction'));
  }).needs('plug/models/Transaction'),
  'plug/collections/userHistory': new SimpleFetcher(function () {
    var UserHistoryHandler = this.require('plug/handlers/UserHistoryHandler');
    return UserHistoryHandler.prototype.collection;
  }).needs('plug/handlers/UserHistoryHandler'),
  'plug/collections/userRooms': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Room')) &&
      m !== this.require('plug/collections/dashboardRooms');
  }).needs('plug/models/Room', 'plug/collections/dashboardRooms'),
  'plug/collections/users': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.getAudience);
  },
  'plug/collections/usersFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) && _.isFunction(m.setFilter) &&
      'sourceCollection' in m;
  }).needs('plug/models/User'),
  'plug/collections/waitlist': function (m) {
    return m instanceof Backbone.Collection && 'isTheUserPlaying' in m;
  },
  'plug/collections/youTubePlaylists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/YouTubePlaylist'));
  }).needs('plug/models/YouTubePlaylist'),
  'plug/collections/youTubePlaylist': new StepwiseMatcher({
    setup: function () {
      // the ImportYouTubeHandler updates the current youtube playlist items
      this.require('plug/handlers/ImportYouTubeHandler').prototype.onMediaLoaded.call(
        // fake context
        { finish: function () {} },
        // recognisable test data
        [ { id: -2000, author: 'plug-modules', title: 'Test item used to find the right collection.' } ]
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/Media')) &&
        m.length === 1 && m.last().get('id') === -2000;
    },
    cleanup: function (youtubePlaylist) {
      youtubePlaylist.reset();
    }
  }).needs('plug/models/Media', 'plug/handlers/ImportYouTubeHandler'),

  // facades
  'plug/facades/chatFacade': function (m) {
    return _.isFunction(m.onChatReceived) && _.isFunction(m.checkMutes);
  },
  'plug/facades/dashboardRoomsFacade': function (m) {
    return _.isFunction(m.more) && _.isFunction(m.loadFavorites);
  },
  'plug/facades/importSoundCloudFacade': function (m) {
    return _.isFunction(m.importAllAlert) && _.isFunction(m.importSelectedAlert);
  },
  'plug/facades/importYouTubeFacade': function (m) {
    return _.isFunction(m.importAlert) && _.isFunction(m.onImportMediaComplete);
  },
  'plug/facades/ImportMediaFacade': function (m) {
    return 'instance' in m && _.isFunction(m.instance.onCIDResult);
  },
  'plug/facades/searchFacade': function (m) {
    return _.isFunction(m.appendUnknown) && _.isFunction(m.resetRelated);
  },
  'plug/facades/relatedMediaFacade': new SimpleFetcher(function (m) {
    return this.require('plug/facades/searchFacade');
  }).needs('plug/facades/searchFacade'),
  'plug/facades/remoteMediaFacade': function (m) {
    return _.isFunction(m.ytSearch) && _.isFunction(m.ytRelated) && _.isFunction(m.scPermalink);
  },
  'plug/facades/playlistsSearchFacade': function (m) {
    return _.isFunction(m.setQuery) && _.isFunction(m.onHistory);
  },

  // application views
  'plug/views/app/ApplicationView': function (m) {
    return m.prototype && m.prototype.el === 'body' && _.isFunction(m.prototype.showRoom);
  },
  'plug/views/app/AppMenuView': function (m) {
    return m.prototype && m.prototype.id === 'app-menu' && _.isFunction(m.prototype.onLogoutClick);
  },

  // dashboard
  'plug/views/dashboard/DashboardBorderView': function (m) {
    return isView(m) && m.prototype.id === 'dashboard-border';
  },
  'plug/views/dashboard/DashboardView': function (m) {
    return isView(m) && m.prototype.id === 'dashboard';
  },
  'plug/views/dashboard/SearchView': function (m) {
    return isView(m) && m.prototype.className === 'search' && _.isFunction(m.prototype.clear) &&
      m.prototype.template === this.require('hbs!templates/dashboard/Search');
  },
  'plug/views/dashboard/TutorialView': function (m) {
    return isView(m) && m.prototype.id === 'tutorial';
  },
  'plug/views/dashboard/list/CellView': function (m) {
    return isView(m) && _.isFunction(m.prototype.onFavorite) && _.isFunction(m.prototype.onFriends);
  },
  'plug/views/dashboard/list/GridView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'grid' &&
      this.isInSameNamespace(name, 'plug/views/dashboard/list/CellView');
  }).needs('plug/views/dashboard/list/CellView'),
  'plug/views/dashboard/list/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' && _.isFunction(m.prototype.select);
  },
  'plug/views/dashboard/header/DashboardHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'app-header' &&
      viewHasElement(m, '.event-calendar');
  },
  'plug/views/dashboard/news/NewsView': function (m) {
    return isView(m) && m.prototype.id === 'news';
  },
  'plug/views/dashboard/news/NewsRowView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'row' &&
      this.isInSameNamespace(name, 'plug/views/dashboard/news/NewsView');
  }).needs('plug/views/dashboard/news/NewsView'),

  // footer
  'plug/views/footer/FacebookMenuView': function (m) {
    return isView(m) && m.prototype.id === 'facebook-menu';
  },
  'plug/views/footer/FooterView': function (m) {
    return isView(m) && m.prototype.id === 'footer';
  },
  'plug/views/footer/PlaylistMetaView': function (m) {
    return isView(m) && m.prototype.id === 'playlist-meta';
  },
  'plug/views/footer/SocialMenuView': function (m) {
    return isView(m) && m.prototype.className === 'social-menu' && m.prototype.template === undefined;
  },
  'plug/views/footer/TwitterMenuView': function (m) {
    return isView(m) && m.prototype.id === 'twitter-menu';
  },
  'plug/views/footer/UserInfoView': function (m) {
    return isView(m) && m.prototype.className === 'info';
  },
  'plug/views/footer/UserMetaView': function (m) {
    return isView(m) && m.prototype.id === 'footer-user';
  },

  // spinners
  'plug/views/spinner/SpinnerView': function (m) {
    return isView(m) && 'LARGE' in m && 'MEDIUM' in m && 'SMALL' in m;
  },

  // tooltips
  'plug/views/tooltips/tooltip': function (m) {
    return m instanceof Backbone.View && m.id === 'tooltip';
  },

  // grab menu
  'plug/views/grabs/grabMenu': function (m) {
    return m instanceof Backbone.View && m.className === 'pop-menu';
  },
  'plug/views/grabs/GrabMenuRow': function (m) {
    return m.prototype && m.prototype.tagName === 'li' &&
      functionContains(m.prototype.render, 'icon-create-playlist') !== -1;
  },

  // on-screen room notifications
  'plug/views/notifications/NotificationsAreaView': function (m) {
    return isView(m) && m.prototype.id === 'toast-notifications';
  },
  'plug/views/notifications/NotificationView': function (m) {
    return isView(m) && m.prototype.className === 'notification' && _.isFunction(m.prototype.slideDown);
  },

  // dialogs
  'plug/views/dialogs/DialogContainerView': function (m) {
    return m.prototype && m.prototype.id === 'dialog-container';
  },
  'plug/views/dialogs/Dialog': function (m) {
    return m.prototype && _.isFunction(m.prototype.onContainerClick);
  },
  'plug/views/dialogs/AlertDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-alert';
  },
  'plug/views/dialogs/BadgeUnlockedDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-badge-unlocked';
  },
  'plug/views/dialogs/BoothLockDialog': function (m) {
    // BoothLockDialog pretends to be a confirm dialog! ):
    return isDialog(m) && m.prototype.id === 'dialog-confirm' &&
      functionContains(m.prototype.adjustTop, 'dialog.lockBoothCancel');
  },
  'plug/views/dialogs/ConfirmDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm';
  },
  'plug/views/dialogs/ForceSkipDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-skip';
  },
  'plug/views/dialogs/GiftSendDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-gift-send';
  },
  'plug/views/dialogs/GiftReceiveDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-gift-receive';
  },
  'plug/views/dialogs/LevelUpDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-level-up';
  },
  'plug/views/dialogs/MediaDeleteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-delete';
  },
  'plug/views/dialogs/MediaRestrictedDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-restricted-media';
  },
  'plug/views/dialogs/MediaUpdateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-media-update';
  },
  'plug/views/dialogs/PlaylistCreateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-create';
  },
  'plug/views/dialogs/PlaylistDeleteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-delete';
  },
  'plug/views/dialogs/PlaylistRenameDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-rename';
  },
  'plug/views/dialogs/PreviewDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-preview' &&
      // tutorial dialogs also have the dialog-preview ID
      m.prototype.className.indexOf('tutorial') === -1;
  },
  'plug/views/dialogs/PurchaseNameChangeView': function (m) {
    return isView(m) && m.prototype.className === 'username-box';
  },
  'plug/views/dialogs/PurchaseDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-purchase';
  },
  'plug/views/dialogs/RoomCreateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-room-create';
  },
  'plug/views/dialogs/StaffRoleDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-user-role';
  },
  'plug/views/dialogs/TutorialDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-preview' &&
      m.prototype.className.indexOf('tutorial') !== -1;
  },
  'plug/views/dialogs/UserMuteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-mute-user';
  },
  'plug/views/dialogs/UserBanDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-ban-user';
  },
  'plug/views/dialogs/UserRoleDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-user-role';
  },

  // playlist views
  'plug/views/playlists/PlaylistPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'playlist-panel';
  },
  'plug/views/playlists/help/PlaylistHelpView': function (m) {
    return isView(m) && m.prototype.className === 'media-list' &&
      _.isFunction(m.prototype.onResize) &&
      viewHasElement(m, '.playlist-overlay-help');
  },
  'plug/views/playlists/import/PlaylistImportPanelView': function (m) {
    return isView(m) && m.prototype.id === 'playlist-import-panel';
  },
  'plug/views/playlists/media/headers/MediaHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header' &&
      !('template' in m.prototype);
  },
  'plug/views/playlists/media/headers/ImportHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header import' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportHeader')();
  },
  'plug/views/playlists/media/headers/PlaylistMediaHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header no-icon' &&
      _.isFunction(m.prototype.onShuffleClick);
  },
  'plug/views/playlists/media/headers/PlaylistSearchHeader': function (m) {
    return isView(m) && !_.isFunction(m.prototype.onQueryUpdate) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SearchMediaHeader')();
  },
  'plug/views/playlists/media/headers/SearchRelatedHeader': function (m) {
    return isView(m) && m.prototype.className === 'header with-back' &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/YouTubePlaylistsHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportYouTubePlaylistsHeader')(Lang);
  },
  'plug/views/playlists/media/headers/SimpleTitleHeader': function (m) {
    return isView(m) && m.prototype.className === 'header' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SimpleTitleHeader')();
  },
  'plug/views/playlists/media/headers/YouTubeMediaHeader': function (m) {
    return isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      _.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/SoundCloudSetsHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      _.isFunction(m.prototype.onImportClick) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportSoundCloudSetsHeader')(Lang);
  },
  'plug/views/playlists/media/headers/SearchMediaHeader': function (m) {
    return isView(m) && _.isFunction(m.prototype.onQueryUpdate) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SearchMediaHeader')();
  },
  // iffy naming below:
  'plug/views/playlists/media/headers/SoundCloudMediaHeader': function (m) {
    return isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      !_.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/SoundCloudTracksHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      _.isFunction(m.prototype.onImportClick) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportSoundCloudHeader')(Lang);
  },
  'plug/views/playlists/media/MediaPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'media-panel';
  },
  'plug/views/playlists/media/panels/MediaActionsView': function (m) {
    return isView(m) && m.prototype.className === 'actions';
  },
  'plug/views/playlists/media/panels/ImportPlaylistsPanelView': function (m) {
    return isView(m) &&
      !m.prototype.collection &&
      m.prototype.className &&
      m.prototype.className.indexOf('import-playlist-list') > -1;
  },
  'plug/views/playlists/media/panels/YouTubePlaylistsPanelView': new SimpleMatcher(function (m) {
    var youTubePlaylists = this.require('plug/collections/youTubePlaylists');
    return isView(m) && m.prototype.collection === youTubePlaylists &&
      m.prototype.className &&
      m.prototype.className.indexOf('import-playlist-list') !== -1;
  }).needs('plug/collections/youTubePlaylists'),
  'plug/views/playlists/media/panels/YouTubePlaylistsRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/YouTubePlaylistsPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/YouTubePlaylistsPanelView'),
  'plug/views/playlists/media/panels/YouTubePlaylistPanelView': new SimpleMatcher(function (m) {
    return isView(m) &&
      m.prototype.listClass === 'import-media' &&
      m.prototype.collection === this.require('plug/collections/youTubePlaylist');
  }).needs('plug/collections/youTubePlaylist'),
  'plug/views/playlists/media/panels/YouTubePlaylistRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/YouTubePlaylistPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/YouTubePlaylistPanelView'),
  'plug/views/playlists/media/panels/PlaylistSearchPanelView': new SimpleMatcher(function (m) {
    return isView(m) &&
      m.prototype.listClass === 'search-playlists' &&
      m.prototype.collection === this.require('plug/collections/playlistSearchResults');
  }).needs('plug/collections/playlistSearchResults'),
  'plug/views/playlists/media/panels/PlaylistSearchRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/PlaylistSearchPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/PlaylistSearchPanelView'),
  'plug/views/playlists/media/panels/RoomHistoryPanelView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.listClass === 'history' &&
      m.prototype.collection === this.require('plug/collections/history');
  }).needs('plug/collections/history'),
  'plug/views/playlists/media/panels/RoomHistoryRowView': new SimpleFetcher(function () {
    var RoomHistoryPanelView = this.require('plug/views/playlists/media/panels/RoomHistoryPanelView');
    return RoomHistoryPanelView.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/RoomHistoryPanelView'),
  'plug/views/playlists/media/panels/UserHistoryPanelView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.collection === this.require('plug/collections/userHistory');
  }).needs('plug/collections/userHistory'),
  'plug/views/playlists/media/panels/UserHistoryRowView': new SimpleFetcher(function () {
    var UserHistoryPanelView = this.require('plug/views/playlists/media/panels/UserHistoryPanelView');
    return UserHistoryPanelView.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/UserHistoryPanelView'),
  'plug/views/playlists/media/panels/PlaylistPanelView': new SimpleMatcher(function (m) {
     return isView(m) && m.prototype.collection === this.require('plug/collections/currentPlaylistFiltered');
   }).needs('plug/collections/currentPlaylistFiltered'),
  'plug/views/playlists/media/panels/PlaylistRowView': new SimpleFetcher(function () {
    var PlaylistPanel = this.require('plug/views/playlists/media/panels/PlaylistPanelView');
    return PlaylistPanel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/PlaylistPanelView'),
  'plug/views/playlists/menu/PlaylistMenuView': function (m) {
    return m instanceof Backbone.View && m.id === 'playlist-menu';
  },
  'plug/views/playlists/menu/PlaylistRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' && _.isFunction(m.prototype.onSyncingChange);
  },
  'plug/views/playlists/search/SearchMenuView': function (m) {
    return isView(m) && m.prototype.id === 'search-menu' && _.isFunction(m.prototype.onYouTubeClick);
  },
  'plug/views/playlists/search/SearchSuggestionView': function (m) {
    return isView(m) && m.prototype.id === 'search-suggestion';
  },
  'plug/views/playlists/search/SearchView': function (m) {
    return isView(m) && m.prototype.id === 'search';
  },

  // user views
  'plug/views/users/userRolloverView': function (m) {
    return m instanceof Backbone.View && m.id === 'user-rollover';
  },
  'plug/views/users/UserView': function (m) {
    return isView(m) && m.prototype.id === 'user-view';
  },
  'plug/views/users/TabbedPanelView': function (m) {
    return isView(m) && 'defaultTab' in m.prototype && m.prototype.defaultTab === undefined;
  },

  'plug/views/users/communities/CommunitiesView': function (m) {
    return isView(m) && m.prototype.id === 'user-communities';
  },
  'plug/views/users/communities/CommunityGridView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'grid' &&
      this.isInSameNamespace(name, 'plug/views/users/communities/CommunitiesView');
  }).needs('plug/views/users/communities/CommunitiesView'),
  'plug/views/users/friends/FriendsView': function (m) {
    return isView(m) && m.prototype.id === 'user-friends';
  },
  'plug/views/users/friends/FriendsTabMenuView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      this.isInSameNamespace(name, 'plug/views/users/friends/FriendsView');
  }).needs('plug/views/users/friends/FriendsView'),
  'plug/views/users/friends/FriendRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      m.prototype.buttonTemplate === this.require('hbs!templates/user/friends/UserFriendButtons');
  },
  'plug/views/users/friends/FriendsListView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'all section' &&
      m.prototype.RowClass === this.require('plug/views/users/friends/FriendRowView');
  }).needs('plug/views/users/friends/FriendRowView'),
  'plug/views/users/friends/FriendRequestRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      m.prototype.buttonTemplate === this.require('hbs!templates/user/friends/UserRequestButtons');
  },
  'plug/views/users/friends/FriendRequestsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'requests section' &&
      m.prototype.RowClass === this.require('plug/views/users/friends/FriendRequestRowView');
  }).needs('plug/views/users/friends/FriendRequestRowView'),
  'plug/views/users/friends/ListView': new SimpleMatcher(function (m, name) {
    return isView(m) && 'collection' in m.prototype && 'RowClass' in m.prototype &&
      m.prototype.collection === undefined && m.prototype.RowClass === undefined &&
      this.isInSameNamespace(name, 'plug/views/users/friends/FriendsView');
  }).needs('plug/views/users/friends/FriendsView'),
  'plug/views/users/friends/SearchView': function (m) {
    return isView(m) && m.prototype.template === this.require('hbs!templates/user/friends/Search');
  },
  'plug/views/users/inventory/InventoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-inventory';
  },
  'plug/views/users/inventory/InventoryTabMenuView': function (m) {
    return isView(m) && m.prototype.template === this.require('hbs!templates/user/inventory/TabMenu');
  },
  'plug/views/users/inventory/InventoryCategoryView': function (m) {
    return isView(m) && 'collection' in m.prototype && 'eventName' in m.prototype &&
      m.prototype.collection === undefined && m.prototype.eventName === undefined;
  },
  'plug/views/users/inventory/AvatarsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'avatars' &&
      m.prototype.eventName === this.require('plug/events/StoreEvent').GET_USER_AVATARS;
  }).needs('plug/events/StoreEvent'),
  'plug/views/users/inventory/AvatarsDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'dropdown' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
      // the avatars and badges dropdowns are nearly identical, their only verifiable
      // difference is in the select() method. the avatars dropdown has an odd special
      // case for Rave avatars.
      functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/AvatarCellView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'cell' &&
      _.isFunction(m.prototype.getBlinkFrame) &&
     this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/BadgesView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'badges' &&
      m.prototype.eventName === this.require('plug/events/StoreEvent').GET_USER_BADGES;
  }).needs('plug/events/StoreEvent'),
  'plug/views/users/inventory/BadgeCellView': function (m, name) {
    return isView(m) && m.prototype.className === 'cell' &&
      functionContains(m.prototype.render, 'change:badge');
  },
  'plug/views/users/inventory/BadgesDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
      // inverse of the avatars dropdown check
      !functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/TransactionHistoryView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'history' &&
     functionContains(m.prototype.render, 'GET_USER_TRANSACTIONS') &&
     this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/TransactionRowView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'row' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/profile/ExperienceView': function (m) {
    return isView(m) && m.prototype.className === 'experience section';
  },
  'plug/views/users/profile/MetaView': function (m) {
    return isView(m) && m.prototype.className === 'meta section';
  },
  'plug/views/users/profile/NotificationsView': function (m) {
    return isView(m) && m.prototype.className === 'notifications section';
  },
  'plug/views/users/profile/NotificationView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      // Lang.userNotifications
      functionContains(m.prototype.render, 'userNotifications');
  },
  'plug/views/users/profile/PointsView': function (m) {
    return isView(m) && m.prototype.className === 'points';
  },
  // Current User Profile,
  'plug/views/users/profile/ProfileView': function (m) {
    return isView(m) && m.prototype.id === 'the-user-profile';
  },
  // Other user profiles? (On the profile pages?)
  'plug/views/users/profile/UnusedProfileView': function (m) {
    return isView(m) && m.prototype.id === 'user-profile';
  },

  'plug/views/users/menu/UserMenuView': function (m) {
    return isView(m) && m.prototype.id === 'user-menu';
  },
  'plug/views/users/menu/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      'template' in m.prototype && m.prototype.template === undefined;
  },

  'plug/views/users/history/UserHistoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-history';
  },

  'plug/views/users/settings/SettingsView': function (m) {
    return isView(m) && m.prototype.id === 'user-settings';
  },
  // there's a bunch of different TabMenuViews, this one is only different from the rest in the methods it lacks
  'plug/views/users/settings/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      !('selectStore' in m.prototype) && !('selectRequests' in m.prototype) &&
      functionContains(m.prototype.onClick, 'application');
  },
  'plug/views/users/settings/SettingsApplicationView': function (m) {
    return isView(m) && m.prototype.className === 'application section';
  },
  'plug/views/users/settings/LanguageDropdownView': function (m) {
    return isView(m) && functionContains(m.prototype.render, '.languages') &&
      functionContains(m.prototype.render, '.get("language")');
  },
  'plug/views/users/settings/SettingsAccountView': function (m) {
    return isView(m) && m.prototype.className === 'account section';
  },
  'plug/views/users/store/StoreView': function (m) {
    return isView(m) && m.prototype.id === 'user-store';
  },
  'plug/views/users/store/StoreCategoryView': new SimpleFetcher(function () {
    // AvatarsView is a subclass of the CategoryView.
    var AvatarsView = this.require('plug/views/users/store/AvatarsView');
    return Object.getPrototypeOf(AvatarsView.prototype).constructor;
  }).needs('plug/views/users/store/AvatarsView'),
  'plug/views/users/store/AvatarsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'avatars' &&
      m.prototype.collection === this.require('plug/collections/purchasableAvatars');
  }).needs('plug/collections/purchasableAvatars'),
  'plug/views/users/store/AvatarCellView': new SimpleFetcher(function () {
    var AvatarsView = this.require('plug/views/users/store/AvatarsView');
    var cellInst = AvatarsView.prototype.getCell(null);
    var AvatarCellView = cellInst.constructor;
    cellInst.destroy();
    return AvatarCellView;
  }).needs('plug/views/users/store/AvatarsView'),
  'plug/views/users/store/AvatarsDropdownView': new SimpleMatcher(function (m, name) {
    // exact duplicate of ../inventory/AvatarsDropdownView
    // ...
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
      // see ../inventory/AvatarsDropdownView
      functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/store/StoreView'),
  'plug/views/users/store/BadgesView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'badges' &&
      m.prototype.collection === this.require('plug/collections/purchasableBadges');
  }).needs('plug/collections/purchasableBadges'),
  'plug/views/users/store/BadgeCellView': new SimpleFetcher(function () {
    var BadgesView = this.require('plug/views/users/store/BadgesView');
    var cellInst = BadgesView.prototype.getCell(null);
    var BadgeCellView = cellInst.constructor;
    cellInst.destroy();
    return BadgeCellView;
  }).needs('plug/views/users/store/BadgesView'),
  'plug/views/users/store/BadgesDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
      // inverse of the avatars dropdown check
      !functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/store/StoreView'),
  'plug/views/users/store/MiscView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'misc' &&
      m.prototype.collection === this.require('plug/collections/storeExtras');
  }).needs('plug/collections/storeExtras'),
  'plug/views/users/store/MiscCellView': new SimpleFetcher(function () {
    var MiscView = this.require('plug/views/users/store/MiscView');
    var cellInst = MiscView.prototype.getCell(null);
    var MiscCellView = cellInst.constructor;
    cellInst.destroy();
    return MiscCellView;
  }).needs('plug/views/users/store/MiscView'),
  'plug/views/users/store/TabMenuView': function (m) {
    return isView(m) &&
      m.prototype.template === this.require('hbs!templates/user/store/TabMenu');
  },

  'plug/views/rooms/audienceView': function (m) {
    return m instanceof Backbone.View && m.id === 'audience';
  },
  'plug/views/rooms/roomLoaderView': function (m) {
    return m instanceof Backbone.View && m.className === 'loading-box';
  },
  'plug/views/rooms/boothView': function (m) {
    return m instanceof Backbone.View && m.id === 'dj-booth';
  },
  'plug/views/rooms/DJButtonView': function (m) {
    return isView(m) && m.prototype.id === 'dj-button';
  },
  'plug/views/rooms/RoomView': function (m) {
    return isView(m) && m.prototype.id === 'room';
  },
  'plug/views/rooms/VotePanelView': function (m) {
    return isView(m) && m.prototype.id === 'vote';
  },
  'plug/views/rooms/walkthrough/GuestWalkthroughView': function (m) {
    return isView(m) && m.prototype.id === 'walkthrough' &&
      _.isFunction(m.prototype.fadeIn);
  },
  'plug/views/rooms/walkthrough/UserWalkthroughView': function (m) {
    return isView(m) && m.prototype.id === 'walkthrough' &&
      !('fadeIn' in m.prototype);
  },
  'plug/views/rooms/header/HistoryPanelView': function (m) {
    return isView(m) && m.prototype.id === 'history-panel';
  },
  'plug/views/rooms/header/NowPlayingView': function (m) {
    return isView(m) && m.prototype.id === 'now-playing-bar';
  },
  'plug/views/rooms/header/RoomMetaView': function (m) {
    return isView(m) && m.prototype.id === 'room-meta';
  },
  'plug/views/rooms/header/RoomBarView': function (m) {
    return isView(m) && m.prototype.id === 'room-bar';
  },
  'plug/views/rooms/header/HeaderPanelBarView': function (m) {
    return isView(m) && m.prototype.id === 'header-panel-bar';
  },
  'plug/views/rooms/header/RoomHeaderView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'app-header' &&
      this.isInSameNamespace(name, 'plug/views/rooms/header/HeaderPanelBarView');
  }).needs('plug/views/rooms/header/HeaderPanelBarView'),
  'plug/views/rooms/playback/PlaybackView': function (m) {
    return isView(m) && m.prototype.id === 'playback';
  },
  'plug/views/rooms/playback/VolumeView': function (m) {
    return isView(m) && m.prototype.id === 'volume';
  },
  'plug/views/rooms/users/BansListView': function (m) {
    return isView(m) && m.prototype.className === 'list bans';
  },
  'plug/views/rooms/users/BanRowView': new SimpleFetcher(function () {
    var BansListView = this.require('plug/views/rooms/users/BansListView');
    return BansListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/BansListView'),
  'plug/views/rooms/users/FriendsListView': function (m) {
    return isView(m) && m.prototype.className === 'friends';
  },
  'plug/views/rooms/users/FriendRowView': new SimpleMatcher(function (m, name) {
   return isView(m) && m.prototype.className === 'row' &&
     _.isFunction(m.prototype.onAvatarChange) &&
     _.isFunction(m.prototype.onStatusChange) &&
     this.isInSameNamespace(name, 'plug/views/rooms/users/FriendsListView');
  }).needs('plug/views/rooms/users/FriendsListView'),
  'plug/views/rooms/users/IgnoresListView': function (m) {
    return isView(m) && m.prototype.className === 'list ignored';
  },
  'plug/views/rooms/users/IgnoreRowView': new SimpleFetcher(function () {
    var IgnoresListView = this.require('plug/views/rooms/users/IgnoresListView');
    return IgnoresListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/IgnoresListView'),
  'plug/views/rooms/users/MutesListView': function (m) {
    return isView(m) && m.prototype.className === 'list mutes';
  },
  'plug/views/rooms/users/MuteRowView': new SimpleFetcher(function () {
    var MutesListView = this.require('plug/views/rooms/users/MutesListView');
    return MutesListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/MutesListView'),
  'plug/views/rooms/users/RoomUsersListView': function (m) {
    return isView(m) && m.prototype.className === 'list room';
  },
  'plug/views/rooms/users/RoomUserRowView': new SimpleFetcher(function () {
    var RoomUsersListView = this.require('plug/views/rooms/users/RoomUsersListView');
    return RoomUsersListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/RoomUsersListView'),
  'plug/views/rooms/users/StaffListView': function (m) {
    return isView(m) && m.prototype.className === 'list staff';
  },
  'plug/views/rooms/users/StaffGroupView': function (m) {
    return isView(m) && m.prototype.className === 'group';
  },
  'plug/views/rooms/users/StaffRowView': function (m) {
    return isView(m) && m.prototype.className === 'user' &&
      !('onConfirm' in m.prototype); // not WaitListRowView, BanRowView, MuteRowView & IgnoreRowView
  },
  'plug/views/rooms/users/UserListView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'list' &&
      m.prototype.collection === this.require('plug/collections/usersFiltered');
  }).needs('plug/collections/usersFiltered'),
  'plug/views/rooms/users/userListsPanelView': function (m) {
    return m instanceof Backbone.View && m.id === 'user-lists';
  },
  'plug/views/rooms/users/WaitListView': function (m) {
    return isView(m) && m.prototype.id === 'waitlist';
  },
  'plug/views/rooms/users/WaitListRowView': function (m) {
    return isView(m) && m.prototype.className === 'user' &&
      _.isFunction(m.prototype.onRemoveClick);
  },
  'plug/views/rooms/chat/ChatView': function (m) {
    return isView(m) && m.prototype.id === 'chat';
  },
  'plug/views/rooms/chat/ChatSuggestionView': function (m) {
    return isView(m) && m.prototype.id === 'chat-suggestion';
  },
  'plug/views/rooms/popout/PopoutChatSuggestionView': function (m) {
    // subclass of ChatSuggestionView with no additional properties
    return isView(m) && m.__super__ && m.__super__.id === 'chat-suggestion';
  },
  'plug/views/rooms/popout/PopoutChatView': function (m) {
    // subclass of ChatView
    return isView(m) && m.__super__ && m.__super__.id === 'chat';
  },
  'plug/views/rooms/popout/PopoutMetaView': function (m) {
    return isView(m) && m.prototype.id === 'meta';
  },
  'plug/views/rooms/popout/PopoutView': function (m) {
    return m instanceof Backbone.View && functionContains(m.show, 'plugdjpopout');
  },
  'plug/views/rooms/popout/PopoutVoteView': function (m) {
    // subclass of VotePanelView
    return isView(m) && m.__super__ && m.__super__.id === 'vote';
  },
  'plug/views/rooms/settings/GeneralSettingsView': function (m) {
    return isView(m) && m.prototype.className === 'general-settings';
  },
  'plug/views/rooms/settings/RoomSettingsMenuView': function (m) {
    return isView(m) && m.prototype.id === 'room-settings-menu';
  },
  'plug/views/rooms/settings/RoomSettingsView': function (m) {
    return isView(m) && m.prototype.id === 'room-settings';
  },
  'plug/views/rooms/settings/ChatLevelDropdownView': function (m) {
    return isView(m) && m.prototype.className === 'dropdown' &&
      functionContains(m.prototype.render, 'minChatLevel');
  },

  'plug/views/search/SearchView': function (m) {
    return isView(m) && m.prototype.className === 'search' &&
      'template' in m.prototype && m.prototype.template === undefined;
  },

  'plug/views/welcome/LoginView': function (m) {
    return isView(m) && m.prototype.className.indexOf('login-mode') !== -1;
  },
  'plug/views/welcome/RegisterView': function (m) {
    return isView(m) && m.prototype.className.indexOf('register-mode') !== -1;
  },
  'plug/views/welcome/SignupOverlayView': function (m) {
    return isView(m) && m.prototype.className === 'sign-up-overlay';
  },
  'plug/views/welcome/UsernameView': function (m) {
    return isView(m) && m.prototype.className === 'username';
  }

};

// build default context
var context = new Context();
Object.keys(plugModules).forEach(function (name) {
  var detective = plugModules[name];
  if (!(detective instanceof Detective)) {
    detective = new SimpleMatcher(detective);
  }
  context.add(name, detective);
});

context.Context = Context;
// expose detective classes
context.Detective = Detective;
context.Matcher = Matcher;
context.SimpleMatcher = SimpleMatcher;
context.StepwiseMatcher = StepwiseMatcher;
context.EventMatcher = EventMatcher;
context.ActionMatcher = ActionMatcher;
context.AndMatcher = AndMatcher;
context.Fetcher = Fetcher;
context.SimpleFetcher = SimpleFetcher;
context.HandlerFetcher = HandlerFetcher;

context.modules = plugModules;

return context;

}));
