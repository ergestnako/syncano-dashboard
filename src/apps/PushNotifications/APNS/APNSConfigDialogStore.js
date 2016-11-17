import Reflux from 'reflux';
import Syncano from 'syncano';
import _ from 'lodash';

// Utils & Mixins
import { DialogStoreMixin, WaitForStoreMixin, StoreLoadingMixin, StoreFormMixin } from '../../../mixins';

// Stores & Actions
import SessionActions from '../../Session/SessionActions';
import APNSPushNotificationsSummaryDialogActions from './APNSPushNotificationsSummaryDialogActions';
import Actions from './APNSPushNotificationsActions';
import APNSDevicesActions from '../../PushDevices/APNSDevices/APNSDevicesActions';

export default Reflux.createStore({
  listenables: Actions,

  mixins: [
    DialogStoreMixin,
    WaitForStoreMixin,
    StoreLoadingMixin,
    StoreFormMixin
  ],

  getInitialState() {
    return {
      certificateTypes: ['development', 'production'],
      isCertLoading: true,
      development_certificate: null,
      development_certificate_name: null,
      development_expiration_date: null,
      development_bundle_identifier: null,
      production_certificate: null,
      production_certificate_name: null,
      production_expiration_date: null,
      production_bundle_identifier: null
    };
  },

  init() {
    this.data = this.getInitialState();
    this.waitFor(
      SessionActions.setInstance,
      this.refreshData
    );
    this.listenToForms();
    this.setLoadingStates();
  },

  refreshData() {
    console.debug('APNSConfigDialogStore::refreshData');
    Actions.fetchAPNSPushNotificationConfig();
    APNSDevicesActions.fetchAPNSConfig();
  },

  onFetchAPNSPushNotificationConfig() {
    console.debug('APNSConfigDialogStore::onFetchAPNSPushNotificationConfig');
    this.data.isCertLoading = true;
    this.trigger(this.data);
  },

  onFetchAPNSPushNotificationConfigCompleted(config) {
    console.debug('APNSConfigDialogStore::onFetchAPNSPushNotificationConfigCompleted');
    Object.keys(config).forEach((key) => {
      if (this.data.hasOwnProperty(key)) {
        this.data[key] = config[key];
      }
    });
    this.data.isCertLoading = false;
    this.trigger(this.data);
  },

  onConfigAPNSPushNotificationCompleted(config) {
    console.debug('APNSConfigDialogStore::onConfigAPNSPushNotification');
    this.dismissDialog();
    this.refreshData();

    if (config.development_certificate || config.production_certificate) {
      APNSPushNotificationsSummaryDialogActions.showDialog();
    }
  },

  onSetCertificate(type, file) {
    const certificate = _.isArray(file) ? file[0] : file;

    const params = {
      [`${type}_certificate_name`]: certificate.name,
      [`${type}_certificate`]: Syncano.file(certificate)
    };

    this.data = { ...this.data, ...params };
    this.trigger(this.data);
  },

  onRemoveCertificateCompleted(type) {
    const params = {
      [`${type}_certificate`]: false,
      [`${type}_certificate_name`]: null,
      [`${type}_bundle_identifier`]: null
    };

    this.data = { ...this.data, ...params };
    this.trigger(this.data);
  }
});
