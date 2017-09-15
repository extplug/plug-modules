import match from './requirejs-finder/match';
import fetch from './requirejs-finder/fetch';
import after from './requirejs-finder/after';
import before from './requirejs-finder/before';
import both from './requirejs-finder/both';
import depends from './requirejs-finder/depends';

import matchAction from './matchAction';
import matchEvent from './matchEvent';
import fetchHandler from './fetchHandler';

import {
  functionContains,
  functionsSeemEqual,
  hasAttributes,
  hasDefaults,
  isCollectionOf,
  isDialog,
  isView,
  viewHasElement
} from './util';

function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  const last = funcs[funcs.length - 1]
  const rest = funcs.slice(0, -1)
  return (...args) => rest.reduceRight((composed, f) => f(composed), last(...args))
}

export default {
  'uuid-js': match(m =>
    _.isFunction(m.create) && _.isFunction(m.randomUI08)
  ),
  'plug/actions/Action': match(m =>
    m.prototype && _.isFunction(m.prototype.alert) && _.isFunction(m.prototype.permissionAlert)
  ),
  'plug/actions/actionQueue': match(m =>
    _.isArray(m.queue) && _.isFunction(m.add) && _.isFunction(m.append) &&
      _.isFunction(m.next) && _.isFunction(m.complete)
  ),

  'plug/actions/auth/AuthResetAction': matchAction('POST', 'auth/reset/me'),
  'plug/actions/auth/AuthTokenAction': matchAction('GET', 'auth/token'),
  'plug/actions/auth/FacebookAuthAction': matchAction('POST', 'auth/facebook'),
  'plug/actions/auth/KillSessionAction': matchAction('DELETE', 'auth/session'),
  'plug/actions/auth/LoginAction': matchAction('POST', 'auth/login'),
  'plug/actions/bans/BanAction': matchAction('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': matchAction('GET', 'bans'),
  'plug/actions/bans/UnbanAction': matchAction('DELETE', null, 'bans/'),
  'plug/actions/bans/WaitlistBanAction': matchAction('POST', 'booth/waitlistban'),
  'plug/actions/bans/ListWaitlistBansAction': matchAction('GET', 'booth/waitlistban'),
  'plug/actions/bans/WaitlistUnbanAction': matchAction('DELETE', null, 'booth/waitlistban/'),
  'plug/actions/booth/JoinWaitlistAction': matchAction('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': matchAction('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': matchAction('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': matchAction('POST', 'booth/skip'),
  'plug/actions/booth/ModerateRemoveDJAction': matchAction('DELETE', null, 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': matchAction('POST', 'booth/skip/me'),
  'plug/actions/booth/BoothLockAction': matchAction('PUT', 'booth/lock'),
  'plug/actions/booth/BoothMoveAction': matchAction('POST', 'booth/move'),
  'plug/actions/booth/BoothSetCycleAction': matchAction('PUT', 'booth/cycle'),
  'plug/actions/friends/BefriendAction': matchAction('POST', 'friends'),
  'plug/actions/friends/ListFriendsAction': matchAction('GET', 'friends'),
  'plug/actions/friends/ListInvitesAction': matchAction('GET', 'friends/invites'),
  'plug/actions/friends/IgnoreRequestAction': matchAction('PUT', 'friends/ignore'),
  'plug/actions/friends/UnfriendAction': matchAction('DELETE', null, 'friends/'),
  'plug/actions/ignores/IgnoreAction': matchAction('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': matchAction('DELETE', null, 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': matchAction('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': matchAction('GET', null, 'playlists/'),
  'plug/actions/media/MediaDeleteAction': matchAction('POST', null, /\/media\/delete$/),
  'plug/actions/media/MediaGrabAction': matchAction('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': matchAction('POST', null, /\/media\/insert$/, [ null, [], null ]),
  'plug/actions/media/MediaMoveAction': matchAction('PUT', null, /\/media\/move$/, [ null, [], null ]),
  'plug/actions/media/MediaUpdateAction': matchAction('PUT', null, /\/media\/update$/),
  'plug/actions/mutes/MuteAction': matchAction('POST', 'mutes'),
  'plug/actions/mutes/UnmuteAction': matchAction('DELETE', null, 'mutes/'),
  'plug/actions/mutes/MutesListAction': matchAction('GET', 'mutes'),
  'plug/actions/news/NewsListAction': matchAction('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': matchAction('DELETE', null, 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': matchAction('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': matchAction('PUT', null, /\/activate$/),
  'plug/actions/playlists/PlaylistCreateAction': matchAction('POST', 'playlists'),
  'plug/actions/playlists/PlaylistDeleteAction': matchAction('DELETE', null, 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': matchAction('PUT', null, /\/rename$/),
  'plug/actions/playlists/PlaylistShuffleAction': matchAction('PUT', null, /\/shuffle$/),
  'plug/actions/profile/SetBlurbAction': matchAction('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': matchAction('GET', null, 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': matchAction('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': matchAction('GET', null, 'rooms?q='),
  'plug/actions/rooms/ModerateDeleteChatAction': matchAction('DELETE', null, 'chat/'),
  'plug/actions/rooms/RoomCreateAction': matchAction('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': matchAction('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': matchAction('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': matchAction('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': matchAction('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': matchAction('DELETE', null, 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': matchAction('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': matchAction('GET', null, 'rooms/validate'),
  'plug/actions/rooms/SOSAction': matchAction('POST', 'rooms/sos'),
  'plug/actions/rooms/VoteAction': matchAction('POST', 'votes'),
  'plug/actions/soundcloud/SoundCloudSearchService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.onResolve) && _.isFunction(m.prototype.parse)
  ),
  'plug/actions/soundcloud/SoundCloudFavoritesService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/favorites')
  ),
  'plug/actions/soundcloud/SoundCloudTracksService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/tracks')
  ),
  'plug/actions/soundcloud/SoundCloudSetsService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/playlists')
  ),
  'plug/actions/soundcloud/SoundCloudPermalinkService': match(m =>
    _.isFunction(m) &&
      _.isFunction(m.prototype.onComplete) &&
      functionContains(m.prototype.onComplete, 'permalink_url')
  ),
  'plug/actions/soundcloud/SoundCloudUserTracksService': match(m =>
    _.isFunction(m) &&
      _.isFunction(m.prototype.onError) &&
      functionContains(m.prototype.onError, 'SoundCloud User Tracks')
  ),
  'plug/actions/staff/StaffListAction': matchAction('GET', 'staff'),
  'plug/actions/staff/StaffRemoveAction': matchAction('DELETE', null, 'staff/'),
  'plug/actions/staff/StaffUpdateAction': matchAction('POST', 'staff/update'),
  'plug/actions/store/ChangeUsernameAction': matchAction('POST', 'store/purchase/username'),
  'plug/actions/store/PurchaseAction': matchAction('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': matchAction('GET', null, 'store/products'),
  'plug/actions/store/InventoryAction': matchAction('GET', null, 'store/inventory'),
  'plug/actions/users/ValidateNameAction': matchAction('GET', null, 'users/validate/'),
  'plug/actions/users/SetLanguageAction': matchAction('PUT', 'users/language'),
  'plug/actions/users/SetAvatarAction': matchAction('PUT', 'users/avatar'),
  'plug/actions/users/SetBadgeAction': matchAction('PUT', 'users/badge'),
  'plug/actions/users/MeAction': matchAction('GET', 'users/me'),
  'plug/actions/users/ListTransactionsAction': matchAction('GET', 'users/me/transactions'),
  'plug/actions/users/UserHistoryAction': matchAction('GET', 'users/me/history'),
  'plug/actions/users/UserFindAction': matchAction('GET', null, 'users/'),
  'plug/actions/users/BulkFindAction': matchAction('POST', 'users/bulk'),
  'plug/actions/users/SendGiftAction': matchAction('POST', 'gift'),
  'plug/actions/users/SaveSettingsAction': matchAction('PUT', 'users/settings'),
  'plug/actions/users/SignupAction': matchAction('POST', 'users/signup'),
  'plug/actions/youtube/YouTubePlaylistService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.onChannel) &&
      _.isFunction(m.prototype.loadLists)
  ),
  'plug/actions/youtube/YouTubeImportService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos) &&
      _.isFunction(m.prototype.loadNext)
  ),
  'plug/actions/youtube/YouTubeSearchService': match(m =>
    _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos) &&
      _.isFunction(m.prototype.loadRelated)
  ),
  'plug/actions/youtube/YouTubeSuggestService': match(m =>
    _.isFunction(m) && functionContains(m.prototype.load, 'google.com/complete/search')
  ),

  'plug/core/EventManager': match(m =>
    _.isObject(m.eventTypeMap) && _.isObject(m.commandClassMap._map)
  ),
  'plug/core/Events': match(m => _.isFunction(m.dispatch) && m.dispatch.length === 1),
  'plug/core/Class': match(m =>
    _.isFunction(m) && _.isFunction(m.extend) && functionsSeemEqual(m, function () {})
  ),
  'plug/core/EventHandler': match(m =>
    _.isFunction(m) && m.prototype &&
      _.isFunction(m.prototype.dispatch) &&
      _.isFunction(m.prototype.trigger) &&
      _.isFunction(m.prototype.execute) &&
      // this is a bit lame, unfortunately plug.dj's "classes" don't publicly store their superclasses
      functionsSeemEqual(m.prototype.execute, function () { this.event = undefined, delete this.event })
  ),
  'plug/core/AsyncHandler': match(m =>
    // subclass of EventHandler
    _.isFunction(m) && m.prototype.hasOwnProperty('listenTo') &&
      m.prototype.hasOwnProperty('finish')
  ),

  'plug/store/settings': match(m => _.isObject(m.settings)),
  'plug/store/media': match(m => _.isFunction(m.deleteOrphans)),
  'plug/store/compress': match(m => _.isFunction(m.compress)),

  'plug/lang/Lang': match(m => 'alerts' in m && 'addedToPlaylist' in m.alerts),

  'plug/util/adblock': match(m => _.isFunction(m.check)),
  'plug/util/analytics': match(m => _.isFunction(m.identify)),
  'plug/util/API': match(m => 'WAIT_LIST_UPDATE' in m && 'CHAT_COMMAND' in m),
  'plug/util/audienceGrid': match(m =>
    _.isFunction(m.defaultInvalidation) && _.isFunction(m.invalidateRoomElements)
  ),
  'plug/util/AvatarManifest': match(m =>
    _.isFunction(m.getAvatarUrl) && _.isFunction(m.getHitSlot)
  ),
  'plug/util/comparators': match(m =>
    _.isFunction(m.uIndex) && _.isFunction(m.priority)
  ),
  'plug/util/DateTime': match(m => _.isFunction(m.ServerDate)),
  'plug/util/Dictionary': match(m =>
    m.prototype && m.prototype._map === null && _.isFunction(m.prototype.adopt)
  ),
  'plug/util/emoji': match(m => _.isFunction(m.replace_emoticons)),
  'plug/util/Environment': match(m => 'isChrome' in m && 'isAndroid' in m),
  'plug/util/Random': match(m =>
    _.isFunction(m) && m.MASTER instanceof m && _.isFunction(m.MASTER.newSeed)
  ),
  'plug/util/soundCloudSdkLoader': match(m => _.isFunction(m.g) && _.isString(m.id)),
  'plug/util/tracker': match(m => _.isFunction(m.track) && m.tracker),
  'plug/util/twitterWidgetLoader': match(m => m.f && _.isFunction(m.i)),
  'plug/util/urls': match(m => 'csspopout' in m && 'scThumbnail' in m),
  'plug/util/userSuggestion': match(m =>
    _.isArray(m.groups) && _.isFunction(m.initGroups) && _.isFunction(m.lookup)
  ),
  'plug/util/util': match(m => _.isFunction(m.h2t)),
  'plug/util/window': match(m => 'PLAYLIST_OFFSET' in m),

  'plug/server/request': match(m =>
    !_.isFunction(m) && _.isFunction(m.execute) &&
      functionContains(m.execute, 'application/json')
  ),
  'plug/server/socketReceiver': match(m =>
    _.isFunction(m.ack) && _.isFunction(m.plugUpdate)
  ),

  'plug/events/Event': matchEvent('Event'),
  'plug/events/AlertEvent': matchEvent('AlertEvent'),
  'plug/events/ChatFacadeEvent': matchEvent('ChatFacadeEvent'),
  'plug/events/CustomRoomEvent': matchEvent('CustomRoomEvent'),
  'plug/events/DJEvent': matchEvent('DJEvent'),
  'plug/events/FacebookLoginEvent': matchEvent('FacebookLoginEvent'),
  'plug/events/FriendEvent': both(
    matchEvent('UserEvent'),
    match(m => m.ACCEPT === 'UserEvent:accept' && m.UNFRIEND === 'UserEvent:unfriend')
  ),
  'plug/events/HistorySyncEvent': matchEvent('HistorySyncEvent'),
  'plug/events/ImportSoundCloudEvent': matchEvent('ImportSoundCloudEvent'),
  'plug/events/ImportYouTubeEvent': matchEvent('ImportYouTubeEvent'),
  'plug/events/MediaActionEvent': matchEvent('MediaActionEvent'),
  'plug/events/MediaDeleteEvent': matchEvent('MediaDeleteEvent'),
  'plug/events/MediaGrabEvent': matchEvent('MediaGrabEvent'),
  'plug/events/MediaInsertEvent': matchEvent('MediaInsertEvent'),
  'plug/events/MediaMoveEvent': matchEvent('MediaMoveEvent'),
  'plug/events/MediaUpdateEvent': matchEvent('MediaUpdateEvent'),
  'plug/events/ModerateEvent': matchEvent('ModerateEvent'),
  'plug/events/PlaylistActionEvent': matchEvent('PlaylistActionEvent'),
  'plug/events/PlaylistCreateEvent': matchEvent('PlaylistCreateEvent'),
  'plug/events/PlaylistDeleteEvent': matchEvent('PlaylistDeleteEvent'),
  'plug/events/PlaylistRenameEvent': matchEvent('PlaylistRenameEvent'),
  'plug/events/PlayMediaEvent': matchEvent('PlayMediaEvent'),
  'plug/events/PreviewEvent': matchEvent('PreviewEvent'),
  'plug/events/RelatedBackEvent': matchEvent('RelatedBackEvent'),
  'plug/events/RestrictedSearchEvent': matchEvent('RestrictedSearchEvent'),
  'plug/events/RoomCreateEvent': matchEvent('RoomCreateEvent'),
  'plug/events/RoomEvent': matchEvent('RoomEvent'),
  'plug/events/ShowDialogEvent': matchEvent('ShowDialogEvent'),
  'plug/events/ShowUserRolloverEvent': matchEvent('ShowUserRolloverEvent'),
  'plug/events/StoreEvent': matchEvent('StoreEvent'),
  'plug/events/UserEvent': both(
    matchEvent('UserEvent'),
    match(m => m.FRIENDS === 'UserEvent:friends' && m.PRESENCE === 'UserEvent:presence')
  ),
  'plug/events/UserListEvent': matchEvent('UserListEvent'),

  'plug/handlers/AlertHandler': fetchHandler('AlertEvent:alert'),
  'plug/handlers/AvatarPurchaseHandler': fetchHandler('StoreEvent:purchaseAvatar'),
  'plug/handlers/BadgePurchaseHandler': fetchHandler('StoreEvent:purchaseBadge'),
  'plug/handlers/BoostPurchaseHandler': fetchHandler('StoreEvent:purchaseBoost'),
  'plug/handlers/CustomRoomHandler': fetchHandler('CustomRoomEvent:custom'),
  'plug/handlers/DJHandler': fetchHandler('DJEvent:join'),
  'plug/handlers/FacebookLoginHandler': fetchHandler('FacebookLoginEvent:login'),
  'plug/handlers/FriendHandler': fetchHandler('UserEvent:accept'),
  'plug/handlers/GrabHandler': fetchHandler('MediaGrabEvent:grab'),
  'plug/handlers/ImportSoundCloudHandler': fetchHandler('ImportSoundCloudEvent:sets'),
  'plug/handlers/ImportYouTubeHandler': fetchHandler('ImportYouTubeEvent:import'),
  'plug/handlers/ListBansHandler': fetchHandler('UserListEvent:bans'),
  'plug/handlers/ListWaitlistBansHandler': fetchHandler('UserListEvent:waitlistBans'),
  'plug/handlers/ListFriendsHandler': fetchHandler('UserEvent:friends'),
  'plug/handlers/ListIgnoresHandler': fetchHandler('UserListEvent:ignored'),
  'plug/handlers/ListInvitesHandler': fetchHandler('UserEvent:invites'),
  'plug/handlers/ListMutesHandler': fetchHandler('UserListEvent:mutes'),
  'plug/handlers/ListPlaylistsHandler': fetchHandler('PlaylistActionEvent:sync'),
  'plug/handlers/ListStaffHandler': fetchHandler('UserListEvent:staff'),
  'plug/handlers/MediaDeleteHandler': fetchHandler('MediaDeleteEvent:delete'),
  'plug/handlers/MediaHandler': fetchHandler('MediaActionEvent:add'),
  'plug/handlers/MediaInsertHandler': fetchHandler('MediaInsertEvent:insert'),
  'plug/handlers/MediaMoveHandler': fetchHandler('MediaMoveEvent:move'),
  'plug/handlers/MediaPlayHandler': fetchHandler('PlayMediaEvent:play'),
  'plug/handlers/MediaUpdateHandler': fetchHandler('MediaUpdateEvent:update'),
  'plug/handlers/ModerateHandler': fetchHandler('ModerateEvent:skip'),
  'plug/handlers/NameChangeHandler': fetchHandler('StoreEvent:purchaseName'),
  'plug/handlers/PlaylistActivateHandler': fetchHandler('PlaylistActionEvent:activate'),
  'plug/handlers/PlaylistCreateHandler': fetchHandler('PlaylistCreateEvent:create'),
  'plug/handlers/PlaylistDeleteHandler': fetchHandler('PlaylistDeleteEvent:delete'),
  'plug/handlers/PlaylistLoadHandler': fetchHandler('PlaylistActionEvent:load'),
  'plug/handlers/PlaylistRenameHandler': fetchHandler('PlaylistRenameEvent:rename'),
  'plug/handlers/PlaylistUpdateHandler': fetchHandler('PlaylistActionEvent:rename'),
  'plug/handlers/PreviewHandler': fetchHandler('PreviewEvent:preview'),
  'plug/handlers/RelatedBackHandler': fetchHandler('RelatedBackEvent:back'),
  'plug/handlers/RestrictedSearchHandler': fetchHandler('RestrictedSearchEvent:search'),
  'plug/handlers/RoomCreateHandler': fetchHandler('RoomCreateEvent:create'),
  'plug/handlers/RoomHistoryHandler': fetchHandler('HistorySyncEvent:room'),
  'plug/handlers/RoomJoinHandler': fetchHandler('RoomEvent:join'),
  'plug/handlers/RoomStateHandler': fetchHandler('RoomEvent:state'),
  'plug/handlers/StoreAvatarsHandler': fetchHandler('StoreEvent:storeAvatars'),
  'plug/handlers/StoreBadgesHandler': fetchHandler('StoreEvent:storeBadges'),
  'plug/handlers/StoreMiscHandler': fetchHandler('StoreEvent:storeMisc'),
  'plug/handlers/StoreTransactionsHandler': fetchHandler('StoreEvent:userTransactions'),
  'plug/handlers/UnbanHandler': fetchHandler('ModerateEvent:unban'),
  'plug/handlers/UnmuteHandler': fetchHandler('ModerateEvent:unmute'),
  'plug/handlers/UserAvatarsHandler': fetchHandler('StoreEvent:userAvatars'),
  'plug/handlers/UserBadgesHandler': fetchHandler('StoreEvent:userBadges'),
  'plug/handlers/UserHistoryHandler': fetchHandler('HistorySyncEvent:user'),
  'plug/handlers/UserMeHandler': fetchHandler('UserEvent:me'),
  'plug/handlers/UserRolloverHandler': fetchHandler('ShowUserRolloverEvent:show'),
  'plug/handlers/WaitlistUnbanHandler': fetchHandler('ModerateEvent:unwaitlistban'),

  'plug/models/Avatar': match(m =>
    m.AUDIENCE && m.DJ && _.isObject(m.IMAGES)
  ),
  'plug/models/Badge': match(m =>
    hasDefaults(m) && 'level' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('category' in m.prototype.defaults) && 'active' in m.prototype.defaults
  ),
  'plug/models/BannedUser': match(m =>
    hasDefaults(m) && 'moderator' in m.prototype.defaults && 'duration' in m.prototype.defaults
  ),
  'plug/models/booth': match(m =>
    hasAttributes(m, [ 'isLocked', 'shouldCycle' ])
  ),
  'plug/models/currentMedia': match(m =>
    _.isFunction(m.onMediaChange) && _.isFunction(m.onStartTimeChange)
  ),
  'plug/models/currentRoom': match(m =>
    m instanceof Backbone.Model && 'fx' in m.attributes
  ),
  'plug/models/currentScore': match(m =>
    _.isFunction(m.vote) && _.isFunction(m.grab) && _.isFunction(m.advance)
  ),
  'plug/models/currentUser': match(m =>
    _.isArray(m._l) && _.isArray(m._x)
  ),
  'plug/models/HistoryEntry': match(m =>
    hasDefaults(m) && 'timestamp' in m.prototype.defaults && 'score' in m.prototype.defaults
  ),
  'plug/models/Media': match(m =>
    hasDefaults(m) && 'cid' in m.prototype.defaults && 'format' in m.prototype.defaults
  ),
  'plug/models/MediaSearchResult': match(m =>
    hasDefaults(m) && 'media' in m.prototype.defaults && 'playlist' in m.prototype.defaults
  ),
  'plug/models/MutedUser': match(m =>
    hasDefaults(m) && 'moderator' in m.prototype.defaults && 'expires' in m.prototype.defaults
  ),
  'plug/models/Notification': match(m =>
    hasDefaults(m) && 'action' in m.prototype.defaults && 'value' in m.prototype.defaults
  ),
  'plug/models/Playlist': match(m =>
    hasDefaults(m) && 'active' in m.prototype.defaults && 'syncing' in m.prototype.defaults
  ),
  'plug/models/Room': match(m =>
    hasDefaults(m) && 'slug' in m.prototype.defaults && 'capacity' in m.prototype.defaults
  ),
  'plug/models/SoundCloudPlaylist': match(m =>
    hasDefaults(m) && 'title' in m.prototype.defaults && 'tracks' in m.prototype.defaults
  ),
  'plug/models/StoreExtra': match(m =>
    hasDefaults(m) && 'category' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('active' in m.prototype.defaults)
  ),
  'plug/models/Transaction': match(m =>
    hasDefaults(m) && 'type' in m.prototype.defaults && 'item' in m.prototype.defaults
  ),
  'plug/models/User': match(m =>
    hasDefaults(m) && 'avatarID' in m.prototype.defaults && 'role' in m.prototype.defaults
  ),
  'plug/models/YouTubePlaylist': match(m =>
    hasDefaults(m) && 'playlistID' in m.prototype.defaults && 'username' in m.prototype.defaults
  ),
  'plug/models/relatedSearch': match(m =>
    hasAttributes(m, [ 'related', 'relatedPlaylist' ])
  ),

  'plug/collections/allAvatars': match(m =>
    m instanceof Backbone.Collection && _.isFunction(m.__generate)
  ),
  'plug/collections/bannedUsers': depends(
    ['plug/models/BannedUser'],
    BannedUser => match(m => isCollectionOf(m, BannedUser))
  ),
  'plug/collections/currentPlaylist': depends(
    ['plug/models/Media'],
    Media => match(m =>
      isCollectionOf(m, Media) && m._events && 'update:next' in m._events
    )
  ),
  'plug/collections/currentPlaylistFiltered': depends(
    ['plug/models/Media'],
    Media => match(m =>
      isCollectionOf(m, Media) && _.isFunction(m.setFilter) && _.isFunction(m.isActualFirst)
    )
  ),
  'plug/collections/dashboardRooms': depends(
    ['plug/models/Room'],
    Room => match(m => {
      if (!isCollectionOf(m, Room)) {
        return false;
      }
      // the dashboardRooms collection has its own comparator that we can check!
      var fakeRoomA = { get(key) { return key === 'population' ? 10 : 'a'; } },
          fakeRoomB = { get(key) { return key === 'population' ? 10 : 'b'; } },
          fakeRoomC = { get(key) { return key === 'population' ? 20 : 'c'; } };
      return functionContains(m.comparator, 'population') &&
        functionContains(m.comparator, 'name') &&
        m.comparator(fakeRoomA, fakeRoomB) === 1 &&
        m.comparator(fakeRoomC, fakeRoomB) === -1;
    })
  ),
  'plug/collections/friendRequests': depends(
    ['plug/views/users/friends/FriendRequestsView'],
    FriendRequestsView => fetch(() => FriendRequestsView.prototype.collection)
  ),
  'plug/collections/friends': depends(
    ['plug/models/User'],
    User => match(m =>
      isCollectionOf(m, User) &&
        _.isFunction(m.onUsersAdd) &&
        _.isFunction(m.lookup) &&
        _.isFunction(m.onRemove) &&
        _.isFunction(m.onAdd) &&
        'MAX' in m.constructor
    )
  ),
  'plug/collections/friendsFiltered': depends(
    ['plug/models/User'],
    User => match(m =>
      isCollectionOf(m, User) &&
        _.isFunction(m.setFilter) &&
        m.comparator === 'uIndex' &&
        // usersFiltered has a sourceCollection
        !('sourceCollection' in m)
    )
  ),
  'plug/collections/history': depends(
    ['plug/handlers/RoomHistoryHandler'],
    RoomHistoryHandler => fetch(() => RoomHistoryHandler.prototype.collection)
  ),
  'plug/collections/ignores': depends(
    ['plug/models/User'],
    User => match(m => isCollectionOf(m, User) && m.comparator === 'username')
  ),
  'plug/collections/mutes': depends(
    ['plug/models/MutedUser'],
    MutedUser => match(m => isCollectionOf(m, MutedUser))
  ),
  'plug/collections/myAvatars': depends(
    ['plug/models/Avatar'],
    Avatar => match(m => isCollectionOf(m, Avatar) && _.isFunction(m.onChange))
  ),
  'plug/collections/myBadges': depends(
    ['plug/models/Badge'],
    Badge => match(m => isCollectionOf(m, Badge) && _.isFunction(m.onChange))
  ),
  'plug/collections/notifications': depends(
    ['plug/models/Notification'],
    Notification => match(m => isCollectionOf(m, Notification))
  ),
  'plug/collections/playlists': depends(
    ['plug/models/Playlist'],
    Playlist => match(m =>
      isCollectionOf(m, Playlist) && _.isFunction(m.jumpToMedia) && _.isArray(m.activeMedia)
    )
  ),
  'plug/collections/playlistSearchResults': depends(
    ['plug/models/MediaSearchResult'],
    // playlist search doesn't actually exist right now, but the models
    // are there on the client side!
    MediaSearchResult => match(m => isCollectionOf(m, MediaSearchResult))
  ),
  'plug/collections/purchasableAvatars': depends(
    ['plug/models/Avatar'],
    Avatar => match(m =>
      isCollectionOf(m, Avatar) &&
        !_.isFunction(m.__generate) && // allAvatars
        !_.isFunction(m.onChange) // myAvatars
    )
  ),
  'plug/collections/purchasableBadges': depends(
    ['plug/models/Badge'],
    Badge => match(m => isCollectionOf(m, Badge) && !_.isFunction(m.onChange)) // myBadges
  ),
  'plug/collections/restrictedMediaAlternatives': depends(
    ['plug/handlers/RestrictedSearchHandler', 'plug/models/Media'],
    (RSHandler, Media) => compose(
      // we cannot get back the original search results, unfortunately,
      // without re-running the search query (which may be possible, but
      // is a little expensive). So there's no after() hook here.
      match(m =>
        isCollectionOf(m, Media) &&
          m.length > 0 && m.last().get('id') === -1000
      ),
      before(() => {
        // the restricted search result handler resets the searchResults
        // array
        RSHandler.prototype.onResult.call(
          { finish() {} },
          [ {
            id: -1000,
            author: 'plug-modules',
            title: 'Test item used to find the right collection.'
          } ]
        );
      })
    )
  ),
  'plug/collections/relatedMedia': depends(
    ['plug/facades/relatedMediaFacade'],
    facade => fetch(() => {
      // this collection gets reset by the relatedMediaFacade, so we can
      // overwrite the reset method on _all_ collections temporarily and
      // trigger a reset. The reset won't actually do anything else but
      // tell us which collection it was called on.
      const reset = Backbone.Collection.prototype.reset;
      let relatedMedia;
      Backbone.Collection.prototype.reset = function () {
        relatedMedia = this;
      };
      // fake a facade object for facade.reset's `this`, so we don't
      // reset anything that might be useful to the user
      facade.reset.call({ data: [] });
      // revert
      Backbone.Collection.prototype.reset = reset;
      return relatedMedia;
    })
  ),
  'plug/collections/soundCloudPlaylists': depends(
    ['plug/models/SoundCloudPlaylist'],
    SoundCloudPlaylist => match(m => isCollectionOf(m, SoundCloudPlaylist))
  ),
  // staff is only updated when a StaffListAction is triggered
  // eg. when the user navigates to the staff tab
  'plug/collections/staff': depends(
    ['plug/models/User', 'plug/util/comparators'],
    (User, { staff }) => match(m => isCollectionOf(m, User) && m.comparator === staff)
  ),
  'plug/collections/staffFiltered': depends(
    ['plug/models/User'],
    User => match(m =>
      isCollectionOf(m, User) && _.isFunction(m.setFilter) && !('sourceCollection' in m)
    )
  ),
  'plug/collections/storeExtras': depends(
    ['plug/models/StoreExtra'],
    StoreExtra => match(m => isCollectionOf(m, StoreExtra))
  ),
  'plug/collections/transactions': depends(
    ['plug/models/Transaction'],
    Transaction => match(m => isCollectionOf(m, Transaction))
  ),
  'plug/collections/userHistory': depends(
    ['plug/handlers/UserHistoryHandler'],
    UserHistoryHandler => fetch(() => UserHistoryHandler.prototype.collection)
  ),
  'plug/collections/userRooms': depends(
    ['plug/models/Room', 'plug/collections/dashboardRooms'],
    (Room, dashboardRooms) => match(m =>
      isCollectionOf(m, Room) && m !== dashboardRooms
    )
  ),
  'plug/collections/users': match(m =>
    m instanceof Backbone.Collection && _.isFunction(m.getAudience)
  ),
  'plug/collections/usersFiltered': depends(
    ['plug/models/User'],
    User => match(m =>
      isCollectionOf(m, User) && _.isFunction(m.setFilter) && 'sourceCollection' in m
    )
  ),
  'plug/collections/waitlist': match(m =>
    m instanceof Backbone.Collection && 'isTheUserPlaying' in m
  ),
  'plug/collections/youTubePlaylists': depends(
    ['plug/models/YouTubePlaylist'],
    YouTubePlaylist => match(m => isCollectionOf(m, YouTubePlaylist))
  ),
  'plug/collections/youTubePlaylist': depends(
    ['plug/models/Media', 'plug/handlers/ImportYouTubeHandler'],
    (Media, ImportYouTubeHandler) => compose(
      match(m => isCollectionOf(m, Media) && m.length === 1 && m.last().get('id') === -2000),
      before(() => {
        // the ImportYouTubeHandler updates the current youtube playlist items
        ImportYouTubeHandler.prototype.onMediaLoaded.call(
          // fake context
          { finish() {} },
          // recognisable test data
          [ { id: -2000, author: 'plug-modules', title: 'Test item used to find the right collection.' } ]
        );
      }),
      after(youTubePlaylist => youtubePlaylist.reset())
    )
  ),

  // facades
  'plug/facades/chatFacade': match(m =>
    _.isFunction(m.onChatReceived) && _.isFunction(m.checkMutes)
  ),
  'plug/facades/dashboardRoomsFacade': match(m =>
    _.isFunction(m.more) && _.isFunction(m.loadFavorites)
  ),
  'plug/facades/importSoundCloudFacade': match(m =>
    _.isFunction(m.importAllAlert) && _.isFunction(m.importSelectedAlert)
  ),
  'plug/facades/importYouTubeFacade': match(m =>
    _.isFunction(m.importAlert) && _.isFunction(m.onImportMediaComplete)
  ),
  'plug/facades/ImportMediaFacade': match(m =>
    'instance' in m && _.isFunction(m.instance.onCIDResult)
  ),
  'plug/facades/searchFacade': match(m =>
    _.isFunction(m.appendUnknown) && _.isFunction(m.resetRelated)
  ),
  'plug/facades/relatedMediaFacade': depends(
    ['plug/facades/searchFacade'],
    searchFacade => fetch(() => searchFacade)
  ),
  'plug/facades/remoteMediaFacade': match(m =>
    _.isFunction(m.ytSearch) && _.isFunction(m.ytRelated) && _.isFunction(m.scPermalink)
  ),
  'plug/facades/playlistsSearchFacade': match(m =>
    _.isFunction(m.setQuery) && _.isFunction(m.onHistory)
  ),

  // application views
  'plug/views/app/ApplicationView': match(m =>
    m.prototype && m.prototype.el === 'body' && _.isFunction(m.prototype.showRoom)
  ),
  'plug/views/app/AppMenuView': match(m =>
    m.prototype && m.prototype.id === 'app-menu' && _.isFunction(m.prototype.onLogoutClick)
  ),

  // dashboard
  'plug/views/dashboard/DashboardBorderView': match(m =>
    isView(m) && m.prototype.id === 'dashboard-border'
  ),
  'plug/views/dashboard/DashboardView': match(m =>
    isView(m) && m.prototype.id === 'dashboard'
  ),
  'plug/views/dashboard/SearchView': depends(
    ['hbs!templates/dashboard/Search'],
    template => match(m =>
      isView(m) && m.prototype.className === 'search' && _.isFunction(m.prototype.clear) &&
        m.prototype.template === template
    )
  ),
  'plug/views/dashboard/TutorialView': match(m =>
    isView(m) && m.prototype.id === 'tutorial'
  ),
  'plug/views/dashboard/list/CellView': match(m =>
    isView(m) && _.isFunction(m.prototype.onFavorite) && _.isFunction(m.prototype.onFriends)
  ),
  'plug/views/dashboard/list/GridView': depends(
    ['plug/views/dashboard/list/CellView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'grid' &&
        context.isInSameNamespace(name, 'plug/views/dashboard/list/CellView')
    )
  ),
  'plug/views/dashboard/list/TabMenuView': match(m =>
    isView(m) && m.prototype.className === 'tab-menu' && _.isFunction(m.prototype.select)
  ),
  'plug/views/dashboard/header/DashboardHeaderView': match(m =>
    isView(m) && m.prototype.className === 'app-header' &&
      // the RoomHeader looks a lot like this, but does not have its own
      // remove() method
      m.prototype.hasOwnProperty('remove') &&
      m.prototype.hasOwnProperty('initialize')
  ),
  'plug/views/dashboard/news/NewsView': match(m => isView(m) && m.prototype.id === 'news'),
  'plug/views/dashboard/news/NewsRowView': depends(
    ['plug/views/dashboard/news/NewsView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'row' &&
        context.isInSameNamespace(name, 'plug/views/dashboard/news/NewsView')
    )
  ),

  // footer
  'plug/views/footer/FacebookMenuView': match(m =>
    isView(m) && m.prototype.id === 'facebook-menu'
  ),
  'plug/views/footer/FooterView': match(m =>
    isView(m) && m.prototype.id === 'footer'
  ),
  'plug/views/footer/PlaylistMetaView': match(m =>
    isView(m) && m.prototype.id === 'playlist-meta'
  ),
  'plug/views/footer/SocialMenuView': match(m =>
    isView(m) && m.prototype.className === 'social-menu' && m.prototype.template === undefined
  ),
  'plug/views/footer/TwitterMenuView': match(m =>
    isView(m) && m.prototype.id === 'twitter-menu'
  ),
  'plug/views/footer/AndroidBadgeView': match(m =>
    isView(m) && m.prototype.id === 'androidbadge-menu'
  ),
  'plug/views/footer/IOSBadgeView': match(m =>
    isView(m) && m.prototype.id === 'iosbadge-menu'
  ),
  'plug/views/footer/UserInfoView': match(m =>
    isView(m) && m.prototype.className === 'info'
  ),
  'plug/views/footer/UserMetaView': match(m =>
    isView(m) && m.prototype.id === 'footer-user'
  ),

  // spinners
  'plug/views/spinner/SpinnerView': match(m =>
    isView(m) && 'LARGE' in m && 'MEDIUM' in m && 'SMALL' in m
  ),

  // tooltips
  'plug/views/tooltips/tooltip': match(m =>
    m instanceof Backbone.View && m.id === 'tooltip'
  ),

  // grab menu
  'plug/views/grabs/grabMenu': match(m =>
    m instanceof Backbone.View && m.className === 'pop-menu'
  ),
  'plug/views/grabs/GrabMenuRow': match(m =>
    m.prototype && m.prototype.tagName === 'li' &&
      functionContains(m.prototype.render, 'icon-create-playlist') !== -1
  ),

  // on-screen room notifications
  'plug/views/notifications/NotificationsAreaView': match(m =>
    isView(m) && m.prototype.id === 'toast-notifications'
  ),
  'plug/views/notifications/NotificationView': match(m =>
    isView(m) && m.prototype.className === 'notification' && _.isFunction(m.prototype.slideDown)
  ),

  // dialogs
  'plug/views/dialogs/DialogContainerView': match(m =>
    m.prototype && m.prototype.id === 'dialog-container'
  ),
  'plug/views/dialogs/Dialog': match(m =>
    m.prototype && _.isFunction(m.prototype.onContainerClick)
  ),
  'plug/views/dialogs/AlertDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-alert'
  ),
  'plug/views/dialogs/BadgeUnlockedDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-badge-unlocked'
  ),
  'plug/views/dialogs/BoothLockDialog': match(m =>
    // BoothLockDialog pretends to be a confirm dialog! ):
    isDialog(m) && m.prototype.id === 'dialog-confirm' &&
      functionContains(m.prototype.adjustTop, 'dialog.lockBoothCancel')
  ),
  'plug/views/dialogs/ConfirmDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-confirm'
  ),
  'plug/views/dialogs/ForceSkipDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-skip'
  ),
  'plug/views/dialogs/ForcedOfferDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-forced-offer'
  ),
  'plug/views/dialogs/GiftSendDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-gift-send'
  ),
  'plug/views/dialogs/GiftReceiveDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-gift-receive'
  ),
  'plug/views/dialogs/LevelUpDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-level-up'
  ),
  'plug/views/dialogs/MediaDeleteDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-delete'
  ),
  'plug/views/dialogs/MediaRestrictedDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-restricted-media'
  ),
  'plug/views/dialogs/MediaUpdateDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-media-update'
  ),
  'plug/views/dialogs/PlaylistCreateDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-playlist-create'
  ),
  'plug/views/dialogs/PlaylistDeleteDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-playlist-delete'
  ),
  'plug/views/dialogs/PlaylistRenameDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-playlist-rename'
  ),
  'plug/views/dialogs/PreviewDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-preview' &&
      // tutorial dialogs also have the dialog-preview ID
      m.prototype.className.indexOf('tutorial') === -1
  ),
  'plug/views/dialogs/PurchaseNameChangeView': match(m =>
    isView(m) && m.prototype.className === 'username-box'
  ),
  'plug/views/dialogs/PurchaseDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-purchase'
  ),
  'plug/views/dialogs/RoomCreateDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-room-create'
  ),
  'plug/views/dialogs/StaffRoleDialog': depends(
    ['plug/views/dialogs/UserRoleDialog'],
    UserRoleDialog => fetch(() => UserRoleDialog)
  ),
  'plug/views/dialogs/SOSDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-sos'
  ),
  'plug/views/dialogs/TutorialDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-preview' &&
      m.prototype.className.indexOf('tutorial') !== -1
  ),
  'plug/views/dialogs/UserMuteDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-mute-user'
  ),
  'plug/views/dialogs/UserBanDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-ban-user'
  ),
  'plug/views/dialogs/UserRoleDialog': match(m =>
    isDialog(m) && m.prototype.id === 'dialog-user-role'
  ),

  // playlist views
  'plug/views/playlists/PlaylistPanelView': match(m =>
    // TODO ensure that there are no other modules that match this footprint
    isView(m) && m.prototype.id === 'playlist-panel'
  ),
  'plug/views/playlists/help/PlaylistHelpView': match(m =>
    isView(m) && m.prototype.className === 'media-list' &&
      _.isFunction(m.prototype.onResize) &&
      !('clear' in m.prototype)
  ),
  'plug/views/playlists/import/PlaylistImportPanelView': match(m =>
    isView(m) && m.prototype.id === 'playlist-import-panel'
  ),
  'plug/views/playlists/media/headers/MediaHeaderView': match(m =>
    isView(m) && m.prototype.className === 'header' &&
      !('template' in m.prototype)
  ),
  'plug/views/playlists/media/headers/ImportHeaderView': depends(
    ['hbs!templates/playlist/media/headers/ImportHeader'],
    (render) => {
      const template = render();
      return match(m =>
        isView(m) && m.prototype.className === 'header import' &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/headers/PlaylistMediaHeaderView': match(m =>
    isView(m) && m.prototype.className === 'header no-icon' &&
      _.isFunction(m.prototype.onShuffleClick)
  ),
  'plug/views/playlists/media/headers/PlaylistSearchHeader': depends(
    ['hbs!templates/playlist/media/headers/SearchMediaHeader'],
    (render) => {
      const template = render();
      return match(m =>
        isView(m) && !_.isFunction(m.prototype.onQueryUpdate) &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/headers/SearchRelatedHeader': match(m =>
    isView(m) && m.prototype.className === 'header with-back' &&
      _.isFunction(m.prototype.onBackClick)
  ),
  'plug/views/playlists/media/headers/YouTubePlaylistsHeader': depends(
    ['hbs!templates/playlist/media/headers/YouTubeImportHeader', 'lang/Lang'],
    (render, Lang) => {
      const template = render(Lang);
      return match(m =>
        isView(m) && m.prototype.className === 'header import' &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/headers/SimpleTitleHeader': depends(
    ['hbs!templates/playlist/media/headers/SimpleTitleHeader'],
    (render) => {
      const template = render();
      return match(m =>
        isView(m) && m.prototype.className === 'header' &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/headers/YouTubeMediaHeader': match(m =>
    isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      _.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick)
  ),
  'plug/views/playlists/media/headers/SoundCloudSetsHeader': depends(
    ['hbs!templates/playlist/media/headers/ImportSoundCloudSetsHeader', 'lang/Lang'],
    (render, Lang) => {
      const template = render(Lang);
      return match(m =>
        isView(m) && m.prototype.className === 'header import' &&
          _.isFunction(m.prototype.onImportClick) &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/headers/SearchMediaHeader': depends(
    ['hbs!templates/playlist/media/headers/SearchMediaHeader'],
    (render) => {
      const template = render();
      return match(m =>
        isView(m) && _.isFunction(m.prototype.onQueryUpdate) &&
          m.prototype.template === template
      );
    }
  ),
  // iffy naming below:
  'plug/views/playlists/media/headers/SoundCloudMediaHeader': match(m =>
    isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      !_.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick)
  ),
  'plug/views/playlists/media/headers/SoundCloudTracksHeader': depends(
    ['hbs!templates/playlist/media/headers/ImportSoundCloudHeader', 'lang/Lang'],
    (render, Lang) => {
      const template = render(Lang);
      return match(m =>
        isView(m) && m.prototype.className === 'header import' &&
          _.isFunction(m.prototype.onImportClick) &&
          m.prototype.template === template
      );
    }
  ),
  'plug/views/playlists/media/MediaPanelView': match(m =>
   // TODO ensure that there are no other modules that match this footprint
    isView(m) && m.prototype.id === 'media-panel'
  ),
  'plug/views/playlists/media/panels/MediaActionsView': match(m =>
     isView(m) && m.prototype.className === 'actions'
  ),
  'plug/views/playlists/media/panels/MediaRowView': match(m =>
     isView(m) && m.actions
  ),
  'plug/views/playlists/media/panels/ImportPlaylistsPanelView': match(m =>
    isView(m) &&
      !m.prototype.collection &&
      m.prototype.className &&
      m.prototype.className.indexOf('import-playlist-list') > -1
  ),
  'plug/views/playlists/media/panels/SoundCloudSetsPanelView': depends(
    ['plug/collections/soundCloudPlaylists'],
    soundCloudPlaylists => match(m =>
      isView(m) && m.prototype.collection === soundCloudPlaylists &&
        m.prototype.hasOwnProperty('onRowRelease')
    )
  ),
  'plug/views/playlists/media/panels/SoundCloudSetPanelView': depends(
    ['plug/collections/soundCloudPlaylists', 'plug/views/playlists/media/panels/YouTubePlaylistRowView'],
    (soundCloudPlaylists, ImportPlaylistRowView) => match(m =>
      isView(m) && m.prototype.collection === soundCloudPlaylists &&
        m.prototype.listClass === 'import-media' &&
        m.prototype.RowClass === ImportPlaylistRowView
    )
  ),
  'plug/views/playlists/media/panels/YouTubePlaylistsPanelView': depends(
    ['plug/collections/youTubePlaylists'],
    youTubePlaylists => match(m =>
      isView(m) && m.prototype.collection === youTubePlaylists &&
        m.prototype.className &&
        m.prototype.className.indexOf('import-playlist-list') !== -1
    )
  ),
  'plug/views/playlists/media/panels/YouTubePlaylistsRowView': depends(
    ['plug/views/playlists/media/panels/YouTubePlaylistsPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/media/panels/YouTubePlaylistPanelView': depends(
    ['plug/collections/youTubePlaylist'],
    youTubePlaylist => match(m =>
      isView(m) &&
        m.prototype.listClass === 'import-media' &&
        m.prototype.collection === youTubePlaylist
    )
  ),
  'plug/views/playlists/media/panels/YouTubePlaylistRowView': depends(
    ['plug/views/playlists/media/panels/YouTubePlaylistPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/media/panels/RestrictedMediaAlternativesPanelView': depends(
    ['plug/collections/restrictedMediaAlternatives'],
    restrictedMediaAlternatives => match(m =>
      isView(m) && m.prototype.collection === restrictedMediaAlternatives &&
        _.isFunction(m.prototype.showLoadSpinner)
    )
  ),
  'plug/views/playlists/media/panels/RestrictedMediaAlternativesRowView': depends(
    ['plug/views/playlists/media/panels/RestrictedMediaAlternativesPanelView'],
    Panel => fetch(() => {
      const p = new Panel();
      p.drawRow(new Backbone.Model({}), 1);
      return p.rows.pop().constructor;
    })
  ),
  'plug/views/playlists/media/panels/PlaylistSearchPanelView': depends(
    ['plug/collections/playlistSearchResults'],
    playlistSearchResults => match(m =>
      isView(m) &&
        m.prototype.listClass === 'search-playlists' &&
        m.prototype.collection === playlistSearchResults
    )
  ),
  'plug/views/playlists/media/panels/PlaylistSearchRowView': depends(
    ['plug/views/playlists/media/panels/PlaylistSearchPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/media/panels/RoomHistoryPanelView': depends(
    ['plug/collections/history'],
    roomHistory => match(m =>
      isView(m) && m.prototype.listClass === 'history' &&
        m.prototype.collection === roomHistory
    )
  ),
  'plug/views/playlists/media/panels/RoomHistoryRowView': depends(
    ['plug/views/playlists/media/panels/RoomHistoryPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/media/panels/UserHistoryPanelView': depends(
    ['plug/collections/userHistory'],
    userHistory => match(m => isView(m) && m.prototype.collection === userHistory)
  ),
  'plug/views/playlists/media/panels/UserHistoryRowView': depends(
    ['plug/views/playlists/media/panels/UserHistoryPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/media/panels/PlaylistPanelView': depends(
    ['plug/collections/currentPlaylistFiltered'],
    currentPlaylistFiltered => match(m =>
      isView(m) && m.prototype.collection === currentPlaylistFiltered
    )
  ),
  'plug/views/playlists/media/panels/PlaylistRowView': depends(
    ['plug/views/playlists/media/panels/PlaylistPanelView'],
    Panel => fetch(() => Panel.prototype.RowClass)
  ),
  'plug/views/playlists/menu/PlaylistMenuView': match(m =>
    m instanceof Backbone.View && m.id === 'playlist-menu'
  ),
  'plug/views/playlists/menu/PlaylistRowView': match(m =>
    isView(m) && m.prototype.className === 'row' && _.isFunction(m.prototype.onSyncingChange)
  ),
  'plug/views/playlists/search/SearchMenuView': match(m =>
    isView(m) && m.prototype.id === 'search-menu' && _.isFunction(m.prototype.onYouTubeClick)
  ),
  'plug/views/playlists/search/SearchSuggestionView': match(m =>
    isView(m) && m.prototype.id === 'search-suggestion'
  ),
  'plug/views/playlists/search/SearchView': match(m =>
    isView(m) && m.prototype.id === 'search'
  ),

  // user views
  'plug/views/users/userRolloverView': match(m =>
    m instanceof Backbone.View && m.id === 'user-rollover'
  ),
  'plug/views/users/UserView': match(m =>
    isView(m) && m.prototype.id === 'user-view'
  ),
  'plug/views/users/TabbedPanelView': match(m =>
    isView(m) && 'defaultTab' in m.prototype && m.prototype.defaultTab === undefined
  ),

  'plug/views/users/communities/CommunitiesView': match(m =>
    isView(m) && m.prototype.id === 'user-communities'
  ),
  'plug/views/users/communities/CommunityGridView': depends(
    ['plug/views/users/communities/CommunitiesView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'grid' &&
        context.isInSameNamespace(name, 'plug/views/users/communities/CommunitiesView')
    )
  ),
  'plug/views/users/friends/FriendsView': match(m =>
    isView(m) && m.prototype.id === 'user-friends'
  ),
  'plug/views/users/friends/FriendsTabMenuView': depends(
    ['plug/views/users/friends/FriendsView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'tab-menu' &&
        context.isInSameNamespace(name, 'plug/views/users/friends/FriendsView')
    )
  ),
  'plug/views/users/friends/FriendRowView': depends(
    ['hbs!templates/user/friends/UserFriendButtons'],
    template => match(m =>
      isView(m) && m.prototype.className === 'row' &&
        m.prototype.buttonTemplate === template
    )
  ),
  'plug/views/users/friends/FriendsListView': depends(
    ['plug/views/users/friends/FriendRowView'],
    FriendRowView => match(m =>
      isView(m) && m.prototype.className === 'all section' &&
        m.prototype.RowClass === FriendRowView
    )
  ),
  'plug/views/users/friends/FriendRequestRowView': depends(
    ['hbs!templates/user/friends/UserRequestButtons'],
    template => match(m =>
      isView(m) && m.prototype.className === 'row' && m.prototype.buttonTemplate === template
    )
  ),
  'plug/views/users/friends/FriendRequestsView': depends(
    ['plug/views/users/friends/FriendRequestRowView'],
    FriendRequestRowView => match(m =>
      isView(m) && m.prototype.className === 'requests section' &&
        m.prototype.RowClass === FriendRequestRowView
    )
  ),
  'plug/views/users/friends/ListView': depends(
    ['plug/views/users/friends/FriendsView'],
    () => match((m, name, context) =>
      isView(m) && 'collection' in m.prototype && 'RowClass' in m.prototype &&
        m.prototype.collection === undefined && m.prototype.RowClass === undefined &&
        context.isInSameNamespace(name, 'plug/views/users/friends/FriendsView')
    )
  ),
  'plug/views/users/friends/SearchView': depends(
    ['hbs!templates/user/friends/Search'],
    template => match(m =>
      isView(m) && m.prototype.template === template
    )
  ),
  'plug/views/users/inventory/InventoryView': match(m =>
    isView(m) && m.prototype.id === 'user-inventory'
  ),
  'plug/views/users/inventory/InventoryTabMenuView': depends(
    ['hbs!templates/user/inventory/TabMenu'],
    template => match(m =>
      isView(m) && m.prototype.template === template
    )
  ),
  'plug/views/users/inventory/InventoryCategoryView': match(m =>
    isView(m) && 'collection' in m.prototype && 'eventName' in m.prototype &&
      m.prototype.collection === undefined && m.prototype.eventName === undefined
  ),
  'plug/views/users/inventory/AvatarsView': depends(
    ['plug/events/StoreEvent'],
    StoreEvent => match(m =>
      isView(m) && m.prototype.className === 'avatars' &&
        m.prototype.eventName === StoreEvent.GET_USER_AVATARS
    )
  ),
  'plug/views/users/inventory/AvatarsDropdownView': depends(
    ['plug/views/users/inventory/InventoryView'],
    InventoryView => match((m, name, context) =>
      isView(m) && m.prototype.className === 'dropdown' &&
        context.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
        // the avatars and badges dropdowns are nearly identical, their only verifiable
        // difference is in the select() method. the avatars dropdown has an odd special
        // case for Rave avatars.
        functionContains(m.prototype.select, 'rhc')
    )
  ),
  'plug/views/users/inventory/AvatarCellView': depends(
    ['plug/views/users/inventory/InventoryView'],
    InventoryView => match((m, name, context) =>
      isView(m) && m.prototype.className === 'cell' &&
        _.isFunction(m.prototype.getBlinkFrame) &&
        context.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView')
    )
  ),
  'plug/views/users/inventory/BadgesView': depends(
    ['plug/events/StoreEvent'],
    StoreEvent => match(m =>
      isView(m) && m.prototype.className === 'badges' &&
        m.prototype.eventName === StoreEvent.GET_USER_BADGES
    )
  ),
  'plug/views/users/inventory/BadgeCellView': match(m =>
    isView(m) && m.prototype.className === 'cell' &&
      functionContains(m.prototype.render, 'change:badge')
  ),
  'plug/views/users/inventory/BadgesDropdownView': depends(
    ['plug/views/users/inventory/InventoryView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.tagName === 'dl' &&
        context.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
        // inverse of the avatars dropdown check
        !functionContains(m.prototype.select, 'rhc')
    )
  ),
  'plug/views/users/inventory/TransactionHistoryView': depends(
    ['plug/views/users/inventory/InventoryView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'history' &&
        functionContains(m.prototype.render, 'GET_USER_TRANSACTIONS') &&
        context.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView')
    )
  ),
  'plug/views/users/inventory/TransactionRowView': depends(
    ['plug/views/users/inventory/InventoryView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'row' &&
        context.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView')
    )
  ),
  'plug/views/users/profile/ExperienceView': match(m =>
    isView(m) && m.prototype.className === 'experience section'
  ),
  'plug/views/users/profile/MetaView': match(m =>
    isView(m) && m.prototype.className === 'meta section'
  ),
  'plug/views/users/profile/NotificationsView': match(m =>
    isView(m) && m.prototype.className === 'notifications section'
  ),
  'plug/views/users/profile/NotificationView': match(m =>
    isView(m) && m.prototype.className === 'row' &&
      // Lang.userNotifications
      functionContains(m.prototype.render, 'userNotifications')
  ),
  'plug/views/users/profile/PointsView': match(m =>
    isView(m) && m.prototype.className === 'points'
  ),
  // Current User Profile,
  'plug/views/users/profile/ProfileView': match(m =>
    isView(m) && m.prototype.id === 'the-user-profile'
  ),
  // Other user profiles? (On the profile pages?)
  'plug/views/users/profile/UnusedProfileView': match(m =>
    isView(m) && m.prototype.id === 'user-profile'
  ),

  'plug/views/users/menu/UserMenuView': match(m =>
    isView(m) && m.prototype.id === 'user-menu'
  ),
  'plug/views/users/menu/TabMenuView': match(m =>
    isView(m) && m.prototype.className === 'tab-menu' &&
      'template' in m.prototype && m.prototype.template === undefined
  ),

  'plug/views/users/history/UserHistoryView': match(m =>
    isView(m) && m.prototype.id === 'user-history'
  ),

  'plug/views/users/settings/SettingsView': match(m =>
    isView(m) && m.prototype.id === 'user-settings'
  ),
  // there's a bunch of different TabMenuViews, this one is only different from the rest in the methods it lacks
  'plug/views/users/settings/TabMenuView': match(m =>
    isView(m) && m.prototype.className === 'tab-menu' &&
      !('selectStore' in m.prototype) && !('selectRequests' in m.prototype) &&
      functionContains(m.prototype.onClick, 'application')
  ),
  'plug/views/users/settings/SettingsApplicationView': match(m =>
    isView(m) && m.prototype.className === 'application section'
  ),
  'plug/views/users/settings/LanguageDropdownView': match(m =>
    isView(m) && functionContains(m.prototype.render, '.languages') &&
      functionContains(m.prototype.render, '.get("language")')
  ),
  'plug/views/users/settings/SettingsAccountView': match(m =>
    isView(m) && m.prototype.className === 'account section'
  ),
  'plug/views/users/store/StoreView': match(m =>
    isView(m) && m.prototype.id === 'user-store'
  ),
  'plug/views/users/store/StoreCategoryView': depends(
    // AvatarsView is a subclass of the CategoryView.
    ['plug/views/users/store/AvatarsView'],
    AvatarsView => fetch(() =>
      Object.getPrototypeOf(AvatarsView.prototype).constructor
    )
  ),
  'plug/views/users/store/AvatarsView': depends(
    ['plug/collections/purchasableAvatars'],
    purchasableAvatars => match(m =>
      isView(m) && m.prototype.className === 'avatars' &&
        m.prototype.collection === purchasableAvatars
    )
  ),
  'plug/views/users/store/AvatarCellView': depends(
    ['plug/views/users/store/AvatarsView'],
    AvatarsView => fetch(() => {
      const cellInst = AvatarsView.prototype.getCell(null);
      const AvatarCellView = cellInst.constructor;
      cellInst.destroy();
      return AvatarCellView;
    })
  ),
  'plug/views/users/store/AvatarsDropdownView': depends(
    ['plug/views/users/store/StoreView'],
    () => match((m, name, context) =>
      // exact duplicate of ../inventory/AvatarsDropdownView
      // ...
      isView(m) && m.prototype.tagName === 'dl' &&
        context.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
        // see ../inventory/AvatarsDropdownView
        functionContains(m.prototype.select, 'rhc')
    )
  ),
  'plug/views/users/store/BadgesView': depends(
    ['plug/collections/purchasableBadges'],
    purchasableBadges => match(m =>
      isView(m) && m.prototype.className === 'badges' &&
        m.prototype.collection === purchasableBadges
    )
  ),
  'plug/views/users/store/BadgeCellView': depends(
    ['plug/views/users/store/BadgesView'],
    BadgesView => fetch(() => {
      const cellInst = BadgesView.prototype.getCell(null);
      const BadgeCellView = cellInst.constructor;
      cellInst.destroy();
      return BadgeCellView;
    })
  ),
  'plug/views/users/store/BadgesDropdownView': depends(
    ['plug/views/users/store/StoreView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.tagName === 'dl' &&
        context.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
        // inverse of the avatars dropdown check
        !functionContains(m.prototype.select, 'rhc')
    )
  ),
  'plug/views/users/store/MiscView': depends(
    ['plug/collections/storeExtras'],
    storeExtras => match(m =>
      isView(m) && m.prototype.className === 'misc' &&
        m.prototype.collection === storeExtras
    )
  ),
  'plug/views/users/store/MiscCellView': depends(
    ['plug/views/users/store/MiscView'],
    MiscView => match(m => {
      const cellInst = MiscView.prototype.getCell(null);
      const MiscCellView = cellInst.constructor;
      cellInst.destroy();
      return MiscCellView;
    })
  ),
  'plug/views/users/store/TabMenuView': depends(
    ['hbs!templates/user/store/TabMenu'],
    template => match(m =>
      isView(m) && m.prototype.template === template
    )
  ),

  'plug/views/rooms/audienceView': match(m =>
    m instanceof Backbone.View && m.id === 'audience'
  ),
  'plug/views/rooms/roomLoaderView': match(m =>
    m instanceof Backbone.View && m.className === 'loading-box'
  ),
  'plug/views/rooms/boothView': match(m =>
    m instanceof Backbone.View && m.id === 'dj-booth'
  ),
  'plug/views/rooms/DJButtonView': match(m =>
    isView(m) && m.prototype.id === 'dj-button'
  ),
  'plug/views/rooms/RoomView': match(m =>
    isView(m) && m.prototype.id === 'room'
  ),
  'plug/views/rooms/VotePanelView': match(m =>
    isView(m) && m.prototype.id === 'vote'
  ),
  'plug/views/rooms/walkthrough/GuestWalkthroughView': match(m =>
    isView(m) && m.prototype.id === 'walkthrough' &&
      _.isFunction(m.prototype.fadeIn)
  ),
  'plug/views/rooms/walkthrough/UserWalkthroughView': match(m =>
    isView(m) && m.prototype.id === 'walkthrough' &&
      !('fadeIn' in m.prototype)
  ),
  'plug/views/rooms/header/HistoryPanelView': match(m =>
    isView(m) && m.prototype.id === 'history-panel'
  ),
  'plug/views/rooms/header/NowPlayingView': match(m =>
    isView(m) && m.prototype.id === 'now-playing-bar'
  ),
  'plug/views/rooms/header/RoomMetaView': match(m =>
    isView(m) && m.prototype.id === 'room-meta'
  ),
  'plug/views/rooms/header/RoomBarView': match(m =>
    isView(m) && m.prototype.id === 'room-bar'
  ),
  'plug/views/rooms/header/HeaderPanelBarView': match(m =>
    isView(m) && m.prototype.id === 'header-panel-bar'
  ),
  'plug/views/rooms/header/RoomHeaderView': depends(
    ['plug/views/rooms/header/HeaderPanelBarView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'app-header' &&
        context.isInSameNamespace(name, 'plug/views/rooms/header/HeaderPanelBarView')
    )
  ),
  'plug/views/rooms/playback/PlaybackView': match(m =>
    isView(m) && m.prototype.id === 'playback'
  ),
  'plug/views/rooms/playback/VolumeView': match(m =>
    isView(m) && m.prototype.id === 'volume'
  ),
  'plug/views/rooms/users/BansListView': match(m =>
    isView(m) && m.prototype.className === 'list bans'
  ),
  'plug/views/rooms/users/BanRowView': depends(
    ['plug/views/rooms/users/BansListView'],
    BansListView => fetch(() => BansListView.prototype.RowClass)
  ),
  'plug/views/rooms/users/FriendsListView': match(m =>
    isView(m) && m.prototype.className === 'friends'
  ),
  'plug/views/rooms/users/FriendRowView': depends(
    ['plug/views/rooms/users/FriendsListView'],
    () => match((m, name, context) =>
      isView(m) && m.prototype.className === 'row' &&
        _.isFunction(m.prototype.onAvatarChange) &&
        _.isFunction(m.prototype.onStatusChange) &&
        context.isInSameNamespace(name, 'plug/views/rooms/users/FriendsListView')
    )
  ),
  'plug/views/rooms/users/IgnoresListView': match(m =>
    isView(m) && m.prototype.className === 'list ignored'
  ),
  'plug/views/rooms/users/IgnoreRowView': depends(
    ['plug/views/rooms/users/IgnoresListView'],
    IgnoresListView => fetch(() => IgnoresListView.prototype.RowClass)
  ),
  'plug/views/rooms/users/MutesListView': match(m =>
    isView(m) && m.prototype.className === 'list mutes'
  ),
  'plug/views/rooms/users/MuteRowView': depends(
    ['plug/views/rooms/users/MutesListView'],
    MutesListView => fetch(() => MutesListView.prototype.RowClass)
  ),
  'plug/views/rooms/users/RoomUsersListView': match(m =>
    isView(m) && m.prototype.className === 'list room'
  ),
  'plug/views/rooms/users/RoomUserRowView': depends(
    ['plug/views/rooms/users/RoomUsersListView'],
    RoomUsersListView => fetch(() => RoomUsersListView.prototype.RowClass)
  ),
  'plug/views/rooms/users/StaffListView': match(m =>
    isView(m) && m.prototype.className === 'list staff'
  ),
  'plug/views/rooms/users/StaffGroupView': match(m =>
    isView(m) && m.prototype.className === 'group'
  ),
  'plug/views/rooms/users/StaffRowView': match(m =>
    isView(m) && m.prototype.className === 'user' &&
      !('onConfirm' in m.prototype) // not WaitListRowView, BanRowView, MuteRowView & IgnoreRowView
  ),
  'plug/views/rooms/users/UserListView': depends(
    ['plug/collections/usersFiltered'],
    usersFiltered => match(m =>
      isView(m) && m.prototype.className === 'list' &&
        m.prototype.collection === usersFiltered
    )
  ),
  'plug/views/rooms/users/userListsPanelView': match(m =>
    m instanceof Backbone.View && m.id === 'user-lists'
  ),
  'plug/views/rooms/users/WaitListView': match(m =>
    isView(m) && m.prototype.id === 'waitlist'
  ),
  'plug/views/rooms/users/WaitListRowView': match(m =>
    isView(m) && m.prototype.className === 'user' &&
      _.isFunction(m.prototype.onRemoveClick)
  ),
  'plug/views/rooms/chat/ChatView': match(m =>
    isView(m) && m.prototype.id === 'chat'
  ),
  'plug/views/rooms/chat/ChatSuggestionView': match(m =>
    isView(m) && m.prototype.id === 'chat-suggestion'
  ),
  'plug/views/rooms/popout/PopoutChatSuggestionView': match(m =>
    // subclass of ChatSuggestionView with no additional properties
    isView(m) && m.__super__ && m.__super__.id === 'chat-suggestion'
  ),
  'plug/views/rooms/popout/PopoutChatView': match(m =>
    // subclass of ChatView
    isView(m) && m.__super__ && m.__super__.id === 'chat'
  ),
  'plug/views/rooms/popout/PopoutMetaView': match(m =>
    isView(m) && m.prototype.id === 'meta'
  ),
  'plug/views/rooms/popout/PopoutView': match(m =>
    m instanceof Backbone.View && functionContains(m.show, 'plugdjpopout')
  ),
  'plug/views/rooms/popout/PopoutVoteView': match(m =>
    // subclass of VotePanelView
    isView(m) && m.__super__ && m.__super__.id === 'vote'
  ),
  'plug/views/rooms/settings/GeneralSettingsView': match(m =>
    isView(m) && m.prototype.className === 'general-settings'
  ),
  'plug/views/rooms/settings/RoomSettingsMenuView': match(m =>
    isView(m) && m.prototype.id === 'room-settings-menu'
  ),
  'plug/views/rooms/settings/RoomSettingsView': match(m =>
    isView(m) && m.prototype.id === 'room-settings'
  ),
  'plug/views/rooms/settings/ChatLevelDropdownView': match(m =>
    isView(m) && m.prototype.className === 'dropdown' &&
      functionContains(m.prototype.render, 'minChatLevel')
  ),

  'plug/views/search/SearchView': match(m =>
    isView(m) && m.prototype.className === 'search' &&
      'template' in m.prototype && m.prototype.template === undefined
  ),

  'plug/views/welcome/LoginView': match(m =>
    isView(m) && m.prototype.className &&
      m.prototype.className.indexOf('login-mode') !== -1
  ),
  'plug/views/welcome/RegisterView': match(m =>
    isView(m) && m.prototype.className &&
      m.prototype.className.indexOf('register-mode') !== -1
  ),
  'plug/views/welcome/SignupOverlayView': match(m =>
    isView(m) && m.prototype.className === 'sign-up-overlay'
  ),
  'plug/views/welcome/UsernameView': match(m =>
    isView(m) && m.prototype.className === 'username'
  )
};
