import React, {useRef, useState, useCallback, useEffect, FC, ReactNode, useMemo} from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useUpdate } from '../lib/crud/withUpdate';
import classNames from 'classnames'
import { useTheme } from './themes/useTheme';
import { useLocation } from '../lib/routeUtil';
import { AnalyticsContext, useTracking } from '../lib/analyticsEvents'
import { UserContext } from './common/withUser';
import { TimezoneWrapper } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './hooks/useCommentBox';
import { ItemsReadContextWrapper } from './hooks/useRecordPostView';
import { commentBodyStyles, pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, blackBarTitle, googleTagManagerIdSetting } from '../lib/publicSettings';
import { isAF, isEAForum, isLW, isLWorAF } from '../lib/instanceSettings';
import { globalStyles } from '../themes/globalStyles/globalStyles';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { Helmet } from '../lib/utils/componentsWithChildren';
import { DisableNoKibitzContext } from './users/UsersNameDisplay';
import { LayoutOptions, LayoutOptionsContext } from './hooks/useLayoutOptions';
// enable during ACX Everywhere
// import { HIDE_MAP_COOKIE } from '../lib/cookies/cookies';
import { HEADER_HEIGHT } from './common/Header';
import { useCookiePreferences } from './hooks/useCookiesWithConsent';
import { useHeaderVisible } from './hooks/useHeaderVisible';
import StickyBox from '../lib/vendor/react-sticky-box';
import { isFriendlyUI } from '../themes/forumTheme';
import { requireCssVar } from '../themes/cssVars';
import { UnreadNotificationsContextProvider } from './hooks/useUnreadNotifications';
import { CurrentForumEventProvider } from './hooks/useCurrentForumEvent';
export const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 0)
export const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 0)

import { LoginPopoverContextProvider } from './hooks/useLoginPopoverContext';
import DeferRender from './common/DeferRender';
import { userHasLlmChat } from '@/lib/betas';
import { AutosaveEditorStateContext } from './editor/EditorFormComponent';
import { GivingSeasonEventsProvider } from './forumEvents/useGivingSeasonEvents';

const STICKY_SECTION_TOP_MARGIN = 20;

/**
 * When a new user signs up, their profile is 'incomplete' (ie; without a display name)
 * and we require them to fill this in using the onboarding flow before continuing.
 * This is a list of route names that the user is allowed to view despite having an
 * 'incomplete' account.
 */
const allowedIncompletePaths: string[] = ["termsOfUse"];

const styles = (theme: ThemeType): JssStyles => ({
  main: {
    paddingTop: theme.spacing.mainLayoutPaddingTop,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    // Make sure the background extends to the bottom of the page, I'm sure there is a better way to do this
    // but almost all pages are bigger than this anyway so it's not that important
    minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
    gridArea: 'main',
    [theme.breakpoints.down('md')]: {
      paddingTop: isFriendlyUI ? 0 : theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      paddingTop: isFriendlyUI ? 0 : 10,
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  wrapper: {
    position: 'relative',
    overflowX: 'clip'
  },
  mainNoFooter: {
    paddingBottom: 0,
  },
  mainFullscreen: {
    height: "100%",
    padding: 0,
  },
  mainUnspacedGrid: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
    }
  },
  fullscreen: {
    // The min height of 600px here is so that the page doesn't shrink down completely when the keyboard is open on mobile.
    // I chose 600 as being a bit smaller than the smallest phone screen size, although it's hard to find a good reference
    // for this. Here is one site with a good list from 2018: https://mediag.com/blog/popular-screen-resolutions-designing-for-all/
    height: "max(100vh, 600px)",
    display: "flex",
    flexDirection: "column",
  },
  fullscreenBodyWrapper: {
    flexBasis: 0,
    flexGrow: 1,
    overflow: "auto",
    [theme.breakpoints.down('xs')]: {
      overflow: "visible",
    },
  },
  spacedGridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar ... main imageGap sunshine"
      `,
      gridTemplateColumns: `
        minmax(0, min-content)
        minmax(0, 1fr)
        minmax(0, min-content)
        minmax(0, ${isLWorAF ? 7 : 1}fr)
        minmax(0, min-content)
      `,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  imageColumn: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: "100vh",
    ['@media(max-width: 1000px)']: {
      display: 'none'
    },
  },
  backgroundImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-57px',
    right: '-334px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  frontpageImage: {
    right: -50,
    height: '82vh',
    objectFit: 'cover',
    '-webkit-mask-image': `radial-gradient(ellipse at top right, ${theme.palette.text.alwaysBlack} 53%, transparent 70%)`,
    zIndex: -2,
    position: 'relative',
  },
  bannerText: {
    ...theme.typography.postStyle,
    ['@media(max-width: 1375px)']: {
      width: 250
    },
    ['@media(max-width: 1325px)']: {
      width: 200
    },
    ['@media(max-width: 1200px)']: {
      display: "none"
    },
    position: 'absolute',
    right: 16,
    bottom: 79,
    color: theme.palette.grey[900],
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    textAlign: "right",
    width: 300,
    '& h2': {
      fontSize: '2.4rem',
      lineHeight: '2.6rem',
      marginTop: 20,
      marginBottom: 0,
      textShadow: `
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}
      `,
      '& a:hover': {
        opacity: 1
      }
    },
    '& h3': {
      fontSize: '20px',
      margin: 0,
      lineHeight: '1.2',
      marginBottom: 6,
      textShadow: `
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 15px ${theme.palette.background.pageActiveAreaBackground}
      `,
    },
    '& button': {
      ...theme.typography.commentStyle,
      backgroundColor: theme.palette.primary.main,
      opacity: .9,
      border: 'none',
      color: theme.palette.text.alwaysWhite,
      fontWeight: 600,
      borderRadius: '3px',
      textAlign: 'center',
      padding: 8,
      fontSize: '14px',
      marginTop: 6
    },
    '& p': {
      ...commentBodyStyles(theme),
      fontSize: '14px',
      marginBottom: 10,
    },
    '& p a': {
      color: theme.palette.primary.main,
    }
  },
  ticketPricesRaise: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic',
    fontSize: 14,
    marginTop: 10,
    '& p': {
      margin: 4
    }
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100vh',
    width: '50vw',
    background: `linear-gradient(to top, ${theme.palette.background.default} 230px, transparent calc(230px + 30%))`,
    zIndex: -1,
  },
  lessOnlineBannerDateAndLocation: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    marginBottom: '16px !important',
  },
  unspacedGridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar main sunshine"
      `,
      gridTemplateColumns: `
        0px
        minmax(0, 1fr)
        minmax(0, min-content)
      `,
    },
    '& .Layout-main': {
      width: '100%',
      paddingTop: 0,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  eaHomeLayout: {
    display: "flex",
    alignItems: "start",
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  navSidebar: {
    gridArea: 'navSidebar'
  },
  sunshine: {
    gridArea: 'sunshine'
  },
  languageModelLauncher: {
    position: 'absolute',
    top: '-57px',
    right: '-334px',
    [theme.breakpoints.down('lg')]: {
      display: 'none',
    }
  },
  whiteBackground: {
    background: theme.palette.background.pageActiveAreaBackground,
  },
  '@global': {
    ...globalStyles(theme),
    p: pBodyStyle(theme),
    '.mapboxgl-popup': {
      willChange: 'auto !important',
      zIndex: theme.zIndexes.styledMapPopup
    },
    // Font fallback to ensure that all greek letters just directly render as Arial
    '@font-face': [{
        fontFamily: "GreekFallback",
        src: "local('Arial')",
        unicodeRange: 'U+0370-03FF, U+1F00-1FFF' // Unicode range for greek characters
      },
      {
        fontFamily: "ETBookRoman",
        src: "url('https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1723063815/et-book-roman-line-figures_tvofzs.woff') format('woff')",  
      },
    ],
    // Hide the CKEditor table alignment menu
    '.ck-table-properties-form__alignment-row': {
      display: "none !important"
    },
  },
  searchResultsArea: {
    position: "absolute",
    zIndex: theme.zIndexes.searchResults,
    top: 0,
    width: "100%",
  },
  // enable during ACX Everywhere
  hideHomepageMapOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  stickyWrapper: {
    transition: "transform 200ms ease-in-out",
    transform: `translateY(${STICKY_SECTION_TOP_MARGIN}px)`,
    marginBottom: 20,
  },
  stickyWrapperHeaderVisible: {
    transform: `translateY(${HEADER_HEIGHT + STICKY_SECTION_TOP_MARGIN}px)`,
  },
});

const wrappedBackgroundColor = requireCssVar("palette", "wrapped", "background")

const StickyWrapper: FC<{
  eaHomeLayout: boolean,
  headerVisible: boolean,
  headerAtTop: boolean,
  children: ReactNode,
  classes: ClassesType,
}> = ({eaHomeLayout, headerVisible, headerAtTop, children, classes}) =>
  eaHomeLayout
    ? (
      <StickyBox offsetTop={0} offsetBottom={20}>
        <div className={classNames(classes.stickyWrapper, {
          [classes.stickyWrapperHeaderVisible]: headerVisible && !headerAtTop,
        })}>
          {children}
        </div>
      </StickyBox>
    )
    : <>{children}</>;

const Layout = ({currentUser, children, classes}: {
  currentUser: UsersCurrent|null,
  children?: React.ReactNode,
  classes: ClassesType,
}) => {
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const [disableNoKibitz, setDisableNoKibitz] = useState(false); 
  const [autosaveEditorState, setAutosaveEditorState] = useState<(() => Promise<void>) | null>(null);
  const hideNavigationSidebarDefault = currentUser ? !!(currentUser?.hideNavigationSidebar) : false
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(hideNavigationSidebarDefault);
  const theme = useTheme();
  const {currentRoute, pathname} = useLocation();
  const layoutOptionsState = React.useContext(LayoutOptionsContext);
  const {headerVisible, headerAtTop} = useHeaderVisible();

  // enable during ACX Everywhere
  // const [cookies] = useCookiesWithConsent()
  const renderCommunityMap = false // replace with following line to enable during ACX Everywhere
  // (isLW) && (currentRoute?.name === 'home') && (!currentUser?.hideFrontpageMap) && !cookies[HIDE_MAP_COOKIE]
  
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  const toggleStandaloneNavigation = useCallback(() => {
    if (currentUser) {
      void updateUser({
        selector: {_id: currentUser._id},
        data: {
          hideNavigationSidebar: !hideNavigationSidebar
        }
      })
    }
    setHideNavigationSidebar(!hideNavigationSidebar);
  }, [updateUser, currentUser, hideNavigationSidebar]);

  // Some pages (eg post pages) have a solid white background, others (eg front page) have a gray
  // background against which individual elements in the central column provide their own
  // background. (In dark mode this is black and dark gray instead of white and light gray). This
  // is handled by putting `classes.whiteBackground` onto the main wrapper.
  //
  // But, caveat/hack: If the page has horizontal scrolling and the horizontal scrolling is the
  // result of a floating window, the page wrapper doesn't extend far enough to the right. So we
  // also have a `useEffect` which adds a class to `<body>`. (This has to be a useEffect because
  // <body> is outside the React tree entirely. An alternative way to do this would be to change
  // overflow properties so that `<body>` isn't scrollable but a `<div>` in here is.)
  const useWhiteBackground = currentRoute?.background === "white";
  
  const { captureEvent } = useTracking();
  
  useEffect(() => {
    const isWhite = document.body.classList.contains(classes.whiteBackground);
    if (isWhite !== useWhiteBackground) {
      if (useWhiteBackground) {
        document.body.classList.add(classes.whiteBackground);
      } else {
        document.body.classList.remove(classes.whiteBackground);
      }
    }
  }, [useWhiteBackground, classes.whiteBackground]);

  if (!layoutOptionsState) {
    throw new Error("LayoutOptionsContext not set");
  }

  const noKibitzContext = useMemo(
    () => ({ disableNoKibitz, setDisableNoKibitz }),
    [disableNoKibitz, setDisableNoKibitz]
  );

  const autosaveEditorStateContext = useMemo(
    () => ({ autosaveEditorState, setAutosaveEditorState }),
    [autosaveEditorState, setAutosaveEditorState]
  );

  let headerBackgroundColor: ColorString;
  // For the EAF Wrapped page, we change the header's background color to a dark blue.
  if (pathname.startsWith('/wrapped')) {
    headerBackgroundColor = wrappedBackgroundColor;
  } else if (pathname.startsWith("/voting-portal")) {
    headerBackgroundColor = "transparent";
  } else if (blackBarTitle.get()) {
    headerBackgroundColor = 'rgba(0, 0, 0, 0.7)';
  }

  const render = () => {
    const {
      NavigationStandalone,
      ErrorBoundary,
      Footer,
      Header,
      FlashMessages,
      AnalyticsClient,
      AnalyticsPageInitializer,
      NavigationEventSender,
      PetrovGameWrapper,
      EAOnboardingFlow,
      BasicOnboardingFlow,
      CommentOnSelectionPageWrapper,
      SidebarsWrapper,
      HomepageCommunityMap,
      AdminToggle,
      SunshineSidebar,
      EAHomeRightHandSide,
      CloudinaryImage2,
      ForumEventBanner,
      GlobalHotkeys,
      LanguageModelLauncherButton,
      LlmChatWrapper,
      TabNavigationMenuFooter
      
    } = Components;

    const baseLayoutOptions: LayoutOptions = {
      // Check whether the current route is one which should have standalone
      // navigation on the side. If there is no current route (ie, a 404 page),
      // then it should.
      // FIXME: This is using route names, but it would be better if this was
      // a property on routes themselves.
      standaloneNavigation: !currentRoute || !!currentRoute.hasLeftNavigationColumn,
      renderSunshineSidebar: !!currentRoute?.sunshineSidebar && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')) && !currentUser?.hideSunshineSidebar,
      renderLanguageModelChatLauncher: !!currentUser && userHasLlmChat(currentUser),
      shouldUseGridLayout: !currentRoute || !!currentRoute.hasLeftNavigationColumn,
      unspacedGridLayout: !!currentRoute?.unspacedGrid,
    }

    const { overridenLayoutOptions: overrideLayoutOptions } = layoutOptionsState

    const standaloneNavigation = overrideLayoutOptions.standaloneNavigation ?? baseLayoutOptions.standaloneNavigation
    const renderSunshineSidebar = overrideLayoutOptions.renderSunshineSidebar ?? baseLayoutOptions.renderSunshineSidebar
    const renderLanguageModelChatLauncher = overrideLayoutOptions.renderLanguageModelChatLauncher ?? baseLayoutOptions.renderLanguageModelChatLauncher
    const shouldUseGridLayout = overrideLayoutOptions.shouldUseGridLayout ?? baseLayoutOptions.shouldUseGridLayout
    const unspacedGridLayout = overrideLayoutOptions.unspacedGridLayout ?? baseLayoutOptions.unspacedGridLayout
    const navigationFooterBar = !currentRoute || currentRoute.navigationFooterBar;
    // The friendly home page has a unique grid layout, to account for the right hand side column.
    const friendlyHomeLayout = isFriendlyUI && currentRoute?.name === 'home'

    const isIncompletePath = allowedIncompletePaths.includes(currentRoute?.name ?? "404");
    
    return (
      <AnalyticsContext path={pathname}>
      <UserContext.Provider value={currentUser}>
      <UnreadNotificationsContextProvider>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <LoginPopoverContextProvider>
      <SidebarsWrapper>
      <AutosaveEditorStateContext.Provider value={autosaveEditorStateContext}>
      <LlmChatWrapper>
      <DisableNoKibitzContext.Provider value={noKibitzContext}>
      <CommentOnSelectionPageWrapper>
      <CurrentForumEventProvider>
      <GivingSeasonEventsProvider>
        <div className={classNames(
          "wrapper",
          {'alignment-forum': isAF, [classes.fullscreen]: currentRoute?.fullscreen, [classes.wrapper]: isLWorAF}
        )} id="wrapper">
          <DialogManager>
            <CommentBoxManager>
              <Helmet>
                {theme.typography.fontDownloads &&
                  theme.typography.fontDownloads.map(
                    (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                  )
                }
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <NavigationEventSender/>
              <GlobalHotkeys/>
              {/* Only show intercom after they have accepted cookies */}
              <DeferRender ssr={false}>
                <MaybeCookieBanner />
              </DeferRender>

              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>

              {!currentRoute?.standalone && <Header
                searchResultsArea={searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                sidebarHidden={hideNavigationSidebar}
                toggleStandaloneNavigation={toggleStandaloneNavigation}
                stayAtTop={!!currentRoute?.staticHeader}
                backgroundColor={headerBackgroundColor}
              />}
              <ForumEventBanner />
              {/* enable during ACX Everywhere */}
              {renderCommunityMap && <span className={classes.hideHomepageMapOnMobile}><HomepageCommunityMap dontAskUserLocation={true}/></span>}

              <div className={classNames(classes.standaloneNavFlex, {
                [classes.spacedGridActivated]: shouldUseGridLayout && !unspacedGridLayout,
                [classes.unspacedGridActivated]: shouldUseGridLayout && unspacedGridLayout,
                [classes.eaHomeLayout]: friendlyHomeLayout && !renderSunshineSidebar,
                [classes.fullscreenBodyWrapper]: currentRoute?.fullscreen,
              }
              )}>
                {isFriendlyUI && <AdminToggle />}
                {standaloneNavigation &&
                  <StickyWrapper
                    eaHomeLayout={friendlyHomeLayout}
                    headerVisible={headerVisible}
                    headerAtTop={headerAtTop}
                    classes={classes}
                  >
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <NavigationStandalone
                        sidebarHidden={hideNavigationSidebar}
                        unspacedGridLayout={unspacedGridLayout}
                        noTopMargin={friendlyHomeLayout}
                      />
                    </DeferRender>
                  </StickyWrapper>
                }
                {isLWorAF && navigationFooterBar && <TabNavigationMenuFooter />}
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: useWhiteBackground,
                  [classes.mainNoFooter]: currentRoute?.noFooter,
                  [classes.mainFullscreen]: currentRoute?.fullscreen,
                  [classes.mainUnspacedGrid]: shouldUseGridLayout && unspacedGridLayout,
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {children}
                    {!isIncompletePath && isEAForum ? <EAOnboardingFlow/> : <BasicOnboardingFlow/>}
                  </ErrorBoundary>
                  {!currentRoute?.fullscreen && !currentRoute?.noFooter && <Footer />}
                </div>
                {isLW && standaloneNavigation && <div className={classes.imageColumn}>
                  {/* Background image shown in the top-right corner of LW. The
                    * loading="lazy" prevents downloading the image if the
                    * screen-size is such that the image will be hidden by a
                    * breakpoint. */}
                  <CloudinaryImage2
                    loading="lazy"
                    className={classes.backgroundImage}
                    publicId="ohabryka_Thomas_W._Schaller_abstract_aquarelle_painting_orbs_wi_08f5e970-d4a5-482f-83c2-a4cb1d388ade_jueaoj"
                    darkPublicId={"DarkOrbs4_gi8ndc"}
                  />
                </div>}
                {!renderSunshineSidebar &&
                  friendlyHomeLayout &&
                  <StickyWrapper
                    eaHomeLayout={friendlyHomeLayout}
                    headerVisible={headerVisible}
                    headerAtTop={headerAtTop}
                    classes={classes}
                  >
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <EAHomeRightHandSide />
                    </DeferRender>
                  </StickyWrapper>
                }
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <DeferRender ssr={false}>
                    <SunshineSidebar/>
                  </DeferRender>
                </div>}
                {renderLanguageModelChatLauncher && <div className={classes.languageModelChatLauncher}>
                  <DeferRender ssr={false}>
                    <LanguageModelLauncherButton/>
                  </DeferRender>
                </div>}
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </GivingSeasonEventsProvider>
      </CurrentForumEventProvider>
      </CommentOnSelectionPageWrapper>
      </DisableNoKibitzContext.Provider>
      </LlmChatWrapper>
      </AutosaveEditorStateContext.Provider>
      </SidebarsWrapper>
      </LoginPopoverContextProvider>
      </ItemsReadContextWrapper>
      </TimezoneWrapper>
      </UnreadNotificationsContextProvider>
      </UserContext.Provider>
      </AnalyticsContext>
    )
  };
  return render();
}

function MaybeCookieBanner() {
  const { IntercomWrapper, CookieBanner } = Components;
  const { explicitConsentGiven: cookieConsentGiven, explicitConsentRequired: cookieConsentRequired } = useCookiePreferences();
  const showCookieBanner = cookieConsentRequired === true && !cookieConsentGiven;

  return showCookieBanner ? <CookieBanner /> : <IntercomWrapper/>;
}

const LayoutComponent = registerComponent('Layout', Layout, {styles});

declare global {
  interface ComponentTypes {
    Layout: typeof LayoutComponent
  }
}
