$(function () {

  const getFeedContent = function ($feedElement) {
    const baseUrl = $feedElement.data("feed-base-url");
    const action = $feedElement.data("feed-action");
    const id = $feedElement.data("feed-id");
    const feedUrl = `${baseUrl}ArticulateFeeds/${action}/${id}`;

    $.get(feedUrl)
      .done(function (data) {
        $feedElement.html(data);
      })
      .fail(function () {
        $feedElement.html("<p class='text-danger'>Sorry, this feed could not be loaded.</p>");
      });
  };

  const feeds = $("#feeds .feed");

  feeds.each(function () {
    getFeedContent($(this));
  });

});
