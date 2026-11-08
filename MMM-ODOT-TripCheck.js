/* MagicMirror² Module: MMM-ODOT-TripCheck
 *
 * By Shaun Rasmusen https://github.com/ardentras
 * MIT License.
 */

Module.register("MMM-ODOT-TripCheck", {
  defaults: {
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
    this.templateContent = "Loading..."

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
      // {
      //       location: response["LocationDescription"],
      //       eventType: response["Type"],
      //       impactType: response["Impact"],
      //       headline: response["Headline"],
      //       commentsHTML: response["Comments"],
      //       eventStart: response["EventStart"],
      //       eventEnd: response["EventEnd"],
      //       lastUpdated: response["UpdateTime"]
      // };
      this.templateContent = `${JSON.stringify(payload)}`
      this.updateDom()
    }
  },

  /**
   * Render the page we're on.
   */
  getDom() {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = `<b>Title</b><br />${this.templateContent}`

    return wrapper
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
