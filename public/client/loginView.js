Shortly.loginView = Backbone.View.extend({
  className: 'login',

  template: Templates['login'],

  events: {
  },

  render: function() {
    console.log(this);
    this.$el.html( this.template() );
    return this;
  },
});
