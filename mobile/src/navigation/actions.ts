import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';

/**
 * Leaves the auth flow and enters the app, replacing the whole root history so
 * the back button / Android back gesture cannot return to Welcome or Login.
 */
export function resetToApp(navigation: Pick<NavigationProp<ParamListBase>, 'getParent' | 'dispatch'>) {
  const root = navigation.getParent() ?? navigation;
  root.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'App', params: { screen: 'HomeTab', params: { screen: 'Home' } } }],
    }),
  );
}

type ParentAware = Pick<NavigationProp<ParamListBase>, 'getParent' | 'dispatch'>;

/** Logs out: walks up to the root navigator and replaces history with the Welcome screen. */
export function resetToAuth(navigation: ParentAware) {
  let root: ParentAware = navigation;
  let parent = root.getParent();
  while (parent) {
    root = parent;
    parent = root.getParent();
  }
  root.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Welcome' } }],
    }),
  );
}
