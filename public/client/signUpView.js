Shortly.signUpView = Backbone.View.extend({
  className: 'signup',

  template: Templates['signup'],

  events: {

  },

  render: function() {
    console.log(this);
    this.$el.html( this.template() );
    return this;
  },

});
