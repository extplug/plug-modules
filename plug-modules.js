/**
 * Adds a module definition.
 *
 * @param {string} name Module name.
 * @param {*} module Module definition. (Not its factory!)
 */
var setDefine = function (name, module) {
  require.s.contexts._.defined[name] = module;
};

/**
 * Find a plug.dj module that matches a filter function.
 *
 * @param {function()} fn Filter function `fn(module)`.
 * @return {?Object} Module, or undefined if no matching module was found.
 */
var plugRequire = function (fn) {
  var defines = require.s.contexts._.defined,
    i, module;
  for (i in defines) if (defines.hasOwnProperty(i)) {
    module = defines[i];
    if (module && fn(module)) {
      module.originalModuleName = i;
      return module;
    }
  }
};

/**
 * Creates a function that matches an Event module.
 *
 * @param {string} name Event name.
 * @return {function()} Matcher function.
 */
var eventModule = function (name) {
  return function (module) { return module._name === name; };
};

/**
 * Creates a function that matches a REST Command module.
 *
 * @param {string} method REST method to match.
 * @param {string} url REST URL to match.
 * @return {function()} Matcher function.
 */
var commandModule = function (method, url) {
  return function (m) {
    return m.prototype && functionContains(m.prototype.execute, '.execute("' + method.toUpperCase()) &&
      functionContains(m.prototype.execute, url);
  };
};

/**
 * Checks if the given module is a Dialog class.
 *
 * @param {Object} m Module.
 * @return True if the module is a Dialog class, false otherwise.
 */
var isDialog = function (m) {
  return m.prototype && m.prototype.className && m.prototype.className.indexOf('dialog') !== -1;
};

/**
 * Checks if two functions are sort of the same by comparing their source.
 *
 * @param {function()} a Function.
 * @param {function()} b Function.
 * @return True if the functions look somewhat alike, false otherwise.
 */
var functionsSeemEqual = function (a, b) {
  return (a + '').replace(/\s/g, '') === (b + '').replace(/\s/g, '');
};

/**
 * Checks if a function's source contains a given string.
 *
 * @param {function()} fn Function.
 * @param {string} match String to look for.
 * @return True if fn contains the string, false otherwise.
 */
var functionContains = function (fn, match) {
  return _.isFunction(fn) && fn.toString().indexOf(match) !== -1;
};

/**
 * Creates a function that matches a View class with the given element ID.
 *
 * @param {string} id ID.
 * @return {function()} Matcher function.
 */
var viewModuleById = function (id) {
  return function (m) {
    return isView(m) && m.prototype.id === id;
  };
};

/**
 * Checks if a given module is a View class.
 *
 * @param {Object} m Module.
 * @return True if the module is a View class, false otherwise.
 */
var isView = function (m) {
  return m.prototype && _.isFunction(m.prototype.render) && _.isFunction(m.prototype.$);
};

/**
 * Checks if a given module has a defaults property (plug.dj models).
 *
 * @param {Object} m Module.
 * @return True if the module has defaults, false otherwise.
 */
var hasDefaults = function (m) {
  return m.prototype && m.prototype.defaults;
};

/**
 * Checks if a View template contains an element matching a given CSS selector.
 *
 * @param {function()} View View class.
 * @param {string} sel CSS Selector.
 * @return True if the View instance contains a matching element, false otherwise.
 */
var viewHasElement = function (View, sel) {
  var stubEl = $('<div>');
  var x = new View({ el: stubEl });
  x.render();
  var has = x.$(sel).length > 0;
  x.remove();
  return has;
};

/**
 * A stub matcher function, matching nothing, for modules that can not yet be matched uniquely.
 *
 * @return {bool} false.
 */
var todo = function () {
  return false;
};

/**
 * Map improvised module name → module filter function. (that hopefully matches only the right module!)
 * This is quite brittle because Plug.DJ can change their internals at any given moment :'
 */
var plugModules = {

  'plug/actions/Action': function (m) {
    return m.prototype && _.isFunction(m.prototype.alert) && _.isFunction(m.prototype.permissionAlert);
  },
  'plug/actions/actionQueue': function (m) {
    return _.isArray(m.queue) && _.isFunction(m.add) && _.isFunction(m.append) &&
      _.isFunction(m.next) && _.isFunction(m.complete);
  },

  'plug/actions/auth/AuthResetAction': commandModule('POST', 'auth/reset/me'),
  'plug/actions/auth/AuthTokenAction': commandModule('GET', 'auth/token'),
  'plug/actions/auth/FacebookAuthAction': commandModule('POST', 'auth/facebook'),
  'plug/actions/auth/KillSessionAction': commandModule('DELETE', 'auth/session'),
  'plug/actions/bans/BanAction': commandModule('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': commandModule('GET', 'bans'),
  'plug/actions/bans/UnbanAction': commandModule('DELETE', 'bans/'),
  'plug/actions/booth/JoinWaitlistAction': commandModule('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': commandModule('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': commandModule('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': commandModule('POST', 'booth/skip'),
  'plug/actions/booth/ModerateRemoveDJAction': commandModule('DELETE', 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': commandModule('POST', 'booth/skip/me'),
  'plug/actions/friends/BefriendAction': commandModule('POST', 'friends'),
  'plug/actions/friends/UnfriendAction': commandModule('DELETE', 'friends/'),
  'plug/actions/ignores/IgnoreAction': commandModule('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': commandModule('DELETE', 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': commandModule('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': commandModule('GET', 'playlists/'),
  'plug/actions/media/MediaDeleteAction': commandModule('POST', 'playlists/"+this.id+"/media/delete'),
  'plug/actions/media/MediaGrabAction': commandModule('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': commandModule('POST', 'playlists/"+this.id+"/media/insert'),
  'plug/actions/media/MediaMoveAction': commandModule('PUT', 'playlists/"+this.id+"/media/move'),
  'plug/actions/media/MediaUpdateAction': commandModule('PUT', 'playlists/"+this.id+"/media/update'),
  'plug/actions/media/SearchPlaylistsAction': commandModule('GET', 'playlists/media?q='),
  'plug/actions/mutes/MuteAction': commandModule('POST', 'mutes'),
  'plug/actions/mutes/MutesListAction': commandModule('GET', 'mutes'),
  'plug/actions/news/NewsListAction': commandModule('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': commandModule('DELETE', 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': commandModule('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': commandModule('PUT', 'playlists/"+this.data+"/activate'),
  'plug/actions/playlists/PlaylistCreateAction': commandModule('POST', 'playlists'),
  'plug/actions/playlists/PlaylistDeleteAction': commandModule('DELETE', 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': commandModule('PUT', 'playlists/"+this.id+"/rename'),
  'plug/actions/playlists/PlaylistShuffleAction': commandModule('PUT', 'playlists/"+this.data+"/shuffle'),
  'plug/actions/profile/SetBlurbAction': commandModule('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': commandModule('GET', 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': commandModule('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': commandModule('GET', 'rooms'),
  'plug/actions/rooms/ModerateDeleteChatAction': commandModule('DELETE', 'chat/"+this.data'),
  'plug/actions/rooms/RoomCreateAction': commandModule('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': commandModule('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': commandModule('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': commandModule('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': commandModule('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': commandModule('DELETE', 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': commandModule('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': commandModule('GET', 'rooms/validate'),
  'plug/actions/rooms/VoteAction': commandModule('POST', 'votes'),
  'plug/actions/staff/StaffListAction': commandModule('GET', 'staff'),
  'plug/actions/staff/StaffRemoveAction': commandModule('DELETE', 'staff/'),
  'plug/actions/staff/StaffUpdateAction': commandModule('POST', 'staff/update'),
  'plug/actions/store/AvatarPurchaseAction': commandModule('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': commandModule('GET', 'store/products'),
  'plug/actions/store/InventoryAction': commandModule('GET', 'store/inventory'),
  'plug/actions/user/SetStatusAction': commandModule('PUT', 'users/status'),
  'plug/actions/user/SetLanguageAction': commandModule('PUT', 'users/language'),
  'plug/actions/user/SetAvatarAction': commandModule('PUT', 'users/avatar'),
  'plug/actions/user/MeAction': commandModule('GET', '"users/me"'),
  'plug/actions/user/UserHistoryAction': commandModule('GET', 'users/me/history'),
  'plug/actions/user/UserFindAction': commandModule('GET', 'users/"+this.data'),
  'plug/actions/user/BulkFindAction': commandModule('GET', 'users/bulk'),

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

  'plug/settings/settings': function (m) {
    return _.isObject(m.settings);
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
  'plug/util/comparators': function (m) {
    return _.isFunction(m.uIndex) && _.isFunction(m.priority);
  },
  'plug/util/Dictionary': function (m) {
    return m.prototype && m.prototype._map === null && _.isFunction(m.prototype.adopt);
  },
  'plug/util/DateTime': function (m) {
    return _.isFunction(m.ServerDate);
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
  'plug/util/urls': function (m) {
    return 'csspopout' in m && 'scThumbnail' in m;
  },
  'plug/util/util': function (m) {
    return _.isFunction(m.h2t);
  },
  'plug/util/window': function (m) {
    return 'PLAYLIST_OFFSET' in m;
  },

  'plug/events/Event': eventModule('Event'),
  'plug/events/AlertEvent': eventModule('AlertEvent'),
  'plug/events/ChatFacadeEvent': eventModule('ChatFacadeEvent'),
  'plug/events/CustomRoomEvent': eventModule('CustomRoomEvent'),
  'plug/events/DJEvent': eventModule('DJEvent'),
  'plug/events/FacebookLoginEvent': eventModule('FacebookLoginEvent'),
  'plug/events/HistorySyncEvent': eventModule('HistorySyncEvent'),
  'plug/events/ImportSoundCloudEvent': eventModule('ImportSoundCloudEvent'),
  'plug/events/ImportYouTubeEvent': eventModule('ImportYouTubeEvent'),
  'plug/events/MediaActionEvent': eventModule('MediaActionEvent'),
  'plug/events/MediaDeleteEvent': eventModule('MediaDeleteEvent'),
  'plug/events/MediaGrabEvent': eventModule('MediaGrabEvent'),
  'plug/events/MediaInsertEvent': eventModule('MediaInsertEvent'),
  'plug/events/MediaMoveEvent': eventModule('MediaMoveEvent'),
  'plug/events/MediaUpdateEvent': eventModule('MediaUpdateEvent'),
  'plug/events/ModerateEvent': eventModule('ModerateEvent'),
  'plug/events/PlaylistActionEvent': eventModule('PlaylistActionEvent'),
  'plug/events/PlaylistCreateEvent': eventModule('PlaylistCreateEvent'),
  'plug/events/PlaylistDeleteEvent': eventModule('PlaylistDeleteEvent'),
  'plug/events/PlaylistRenameEvent': eventModule('PlaylistRenameEvent'),
  'plug/events/PlayMediaEvent': eventModule('PlayMediaEvent'),
  'plug/events/PreviewEvent': eventModule('PreviewEvent'),
  'plug/events/RelatedBackEvent': eventModule('RelatedBackEvent'),
  'plug/events/RestrictedSearchEvent': eventModule('RestrictedSearchEvent'),
  'plug/events/RoomCreateEvent': eventModule('RoomCreateEvent'),
  'plug/events/RoomEvent': eventModule('RoomEvent'),
  'plug/events/ShowDialogEvent': eventModule('ShowDialogEvent'),
  'plug/events/ShowUserRolloverEvent': eventModule('ShowUserRolloverEvent'),
  'plug/events/StoreEvent': eventModule('StoreEvent'),
  'plug/events/UserEvent': eventModule('UserEvent'),
  'plug/events/UserListEvent': eventModule('UserListEvent'),

  'plug/models/Avatar': function (m) {
    return m.AUDIENCE && m.DJ && _.isObject(m.IMAGES);
  },
  'plug/models/BannedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'duration' in m.prototype.defaults;
  },
  'plug/models/booth': function (m) {
    return 'isLocked' in m && 'shouldCycle' in m;
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
  'plug/models/ImportingPlaylist': function (m) {
    return hasDefaults(m) && 'title' in m.prototype.defaults && 'tracks' in m.prototype.defaults;
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
    return hasDefaults(m) && 'playlistID' in m.prototype.defaults && 'username' in m.prototype.defaults;
  },
  'plug/models/Room': function (m) {
    return hasDefaults(m) && 'slug' in m.prototype.defaults && 'capacity' in m.prototype.defaults;
  },
  'plug/models/User': function (m) {
    return hasDefaults(m) && 'avatarID' in m.prototype.defaults && 'role' in m.prototype.defaults;
  },
  'plug/models/relatedMedia': todo,

  'plug/collections/history': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.onPointsChange);
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
    return isView(m) && m.prototype.className === 'search' && _.isFunction(m.prototype.clear);
  },
  'plug/views/dashboard/TutorialView': function (m) {
    return isView(m) && m.prototype.id === 'tutorial';
  },
  'plug/views/dashboard/list/CellView': function (m) {
    return isView(m) && _.isFunction(m.prototype.onFavorite) && _.isFunction(m.prototype.onFriends);
  },
  'plug/views/dashboard/list/GridMenuView': todo,
  'plug/views/dashboard/list/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' && _.isFunction(m.prototype.select);
  },
  'plug/views/dashboard/header/DashboardHeaderView': todo,
  'plug/views/dashboard/news/NewsView': function (m) {
    return isView(m) && m.prototype.id === 'news';
  },
  'plug/views/dashboard/news/NewsRowView': todo,

  // spinners
  'plug/views/spinner/SpinnerView': function (m) {
    return isView(m) && 'LARGE' in m && 'MEDIUM' in m && 'SMALL' in m;
  },

  // grab menu
  'plug/views/grabs/GrabMenu': function (m) {
    return m instanceof Backbone.View && m.className === 'pop-menu';
  },
  'plug/views/grabs/GrabMenuRow': function (m) {
    return m.prototype && m.prototype.tagName === 'li' &&
      functionContains(m.prototype.render, 'icon-create-playlist') !== -1;
  },

  // dialogs
  'plug/views/dialogs/AlertDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-alert';
  },
  'plug/views/dialogs/ConfirmDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm';
  },
  'plug/views/dialogs/ForceSkipDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-skip';
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
      m.prototype.className.indexOf('tutorial') === -1;
  },
  'plug/views/dialogs/UserRoleDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-user-role';
  },
  'plug/views/dialogs/TutorialDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-preview' &&
      m.prototype.className.indexOf('tutorial') !== -1;
  },
  'plug/views/dialogs/UserBanDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-ban-user';
  },
  'plug/views/dialogs/UserMuteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-mute-user';
  },
  'plug/views/dialogs/DialogContainerView': function (m) {
    return m.prototype && m.prototype.id === 'dialog-container';
  },
  'plug/views/dialogs/Dialog': function (m) {
    return m.prototype && _.isFunction(m.prototype.onContainerClick);
  },
  // BoothLockDialog is the only dialog with a "dialog-confirm" id and a "destructive" class.
  'plug/views/dialogs/BoothLockDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm' &&
      m.prototype.className.indexOf('destructive') === -1;
  },

  // user views
  'plug/views/user/userRolloverView': function (m) {
    return _.isObject(m) && m instanceof Backbone.View && m.id === 'user-rollover';
  },
  'plug/views/user/UserView': function (m) {
    return isView(m) && m.prototype.id === 'user-view';
  },

  'plug/views/user/communities/CommunitiesView': function (m) {
    return isView(m) && m.prototype.id === 'user-communities';
  },
  'plug/views/user/communities/CommunityGridView': todo,

  'plug/views/user/profile/ExperienceView': function (m) {
    return isView(m) && m.prototype.className === 'experience section';
  },
  'plug/views/user/profile/MetaView': function (m) {
    return isView(m) && m.prototype.className === 'meta section';
  },
  'plug/views/user/profile/NotificationsView': function (m) {
    return isView(m) && m.prototype.className === 'notifications section';
  },
  'plug/views/user/profile/NotificationView': todo,
  'plug/views/user/profile/PointsView': function (m) {
    return isView(m) && m.prototype.className === 'points';
  },
  // Current User Profile,
  'plug/views/user/profile/ProfileView': function (m) {
    return isView(m) && m.prototype.id === 'the-user-profile';
  },
  // Other user profiles? (On the profile pages?)
  'plug/views/user/profile/UnusedProfileView': function (m) {
    return isView(m) && m.prototype.id === 'user-profile';
  },

  'plug/views/user/menu/UserMenuView': function (m) {
    return isView(m) && m.prototype.id === 'user-menu';
  },

  'plug/views/user/history/UserHistoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-history';
  },

  'plug/views/user/settings/SettingsView': function (m) {
    return isView(m) && m.prototype.id === 'user-settings';
  },
  // there's a bunch of different TabMenuViews, this one is only different from the rest in the methods it lacks
  'plug/views/user/settings/TabMenuView': function (m) {
    return m.prototype && m.prototype.className === 'tab-menu' &&
      !('selectStore' in m.prototype) && !('select' in m.prototype) && !('selectRequests' in m.prototype);
  },
  'plug/views/user/settings/SettingsApplicationView': function (m) {
    return m.prototype && m.prototype.className === 'application section';
  },
  'plug/views/user/settings/SettingsAccountView': function (m) {
    return m.prototype && m.prototype.className === 'account section';
  },
  'plug/views/room/audienceView': function (m) {
    return m instanceof Backbone.View && m.id === 'audience';
  },
  'plug/views/room/roomLoaderView': function (m) {
    return m instanceof Backbone.View && m.id === 'room-loader';
  },
  'plug/views/room/boothView': function (m) {
    return m instanceof Backbone.View && m.id === 'dj-booth';
  },
  'plug/views/room/DJButtonView': function (m) {
    return isView(m) && m.prototype.id === 'dj-button';
  },
  'plug/views/room/RoomView': function (m) {
    return isView(m) && m.prototype.id === 'room';
  },
  'plug/views/room/VotePanelView': function (m) {
    return isView(m) && m.prototype.id === 'vote';
  },
  'plug/views/room/playback/PlaybackView': function (m) {
    return isView(m) && m.prototype.id === 'playback';
  },
  'plug/views/room/playback/VolumeView': function (m) {
    return isView(m) && m.prototype.id === 'volume';
  },
  'plug/views/room/users/RoomUserRowView': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.vote);
  },
  'plug/views/rooms/chat/ChatView': function (m) {
    return isView(m) && m.prototype.id === 'chat';
  }
};

_.each(plugModules, function (filter, name) {
  setDefine(name, plugRequire(filter));
});

