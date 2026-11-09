/* MagicMirror² Module: MMM-ODOT-TripCheck
 *
 * By Shaun Rasmusen https://github.com/ardentras
 * MIT License.
 */

Module.register("MMM-ODOT-TripCheck", {
  defaults: {
    incidents: {
      local: {
        display: true
      },
      state: {
        display: true,
        activeEvents: true
      }
    }
  },

  /**
   * Apply the default styles.
   */
  getStyles() {
    return ["template.css"]
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() {
    this.templateData = {
      headerPrefix: "TripCheck",
      loadingContent: "Loading...",
      incidents: null
    }

    this.getIncidentInformation();

    setInterval(() => this.getIncidentInformation(), 120000)
  },

  /**
   * Handle notifications received by the node helper.
   * So we can communicate between the node helper and the module.
   *
   * @param {string} notification - The notification identifier.
   * @param {any} payload - The payload data`returned by the node helper.
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_INCIDENT_INFORMATION_COMPLETE") {
      let isPlural = payload.length > 1 || payload.length == 0 ? 's' : '';
      this.templateData.header = `${this.templateData.headerPrefix}: ${payload.length} incident${isPlural}`;
      this.templateData.incidents = payload;

      console.log(payload);

      this.updateDom()
    }
  },

  getTemplateData() {
    return this.templateData;
  },

  getTemplate() {
    return "template.njk"
  },

  getHeader() {
    return this.templateData.header;
  },

  getIncidentInformation() {
    this.sendSocketNotification("GET_INCIDENT_INFORMATION", this.config);
  },

  /**
   * This is the place to receive notifications from other modules or the system.
   *
   * @param {string} notification The notification ID, it is preferred that it prefixes your module name
   * @param {number} payload the payload type.
   */
  // notificationReceived(notification, payload) {
  //   if (notification === "TEMPLATE_RANDOM_TEXT") {
  //     this.templateContent = `${this.config.exampleContent} ${payload}`
  //     this.updateDom()
  //   }
  // }
})
