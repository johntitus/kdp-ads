# kdp-ads
A chrome extension to help manage KDP ads on Amazon.

# Installation
- Click the button above marked `Code`, then Download Zip.
- Unzip to a folder on your computer.
- In your browser, go to `chrome://extensions`
- Turn on `Developer Mode`
- Click on `Load Unpacked`
- Select the unzipped folder.

# Usage

The extension will calculate the proper Placement percentage for Top of Search and Product Pages. Click on the `Placement` option inside a campaign. You'll see a `suggested` percentage below the Bid Adjustement input. 

The extension will assume you're using the `suggested` placement, and use that to calculate a `Bid Multiplier`, which will reduce your suggested bid in side your campaign targets.  If you do not use the suggested bid adjustment,
be sure to update the `Bid Multiplier` accordingly. If the Placement is 0%, the Bid Multiplier should be 1.

Inside each `Ad Group -> Targeting` you'll see the suggested bid in the Bid column.  This is calcuated as `Target ACoS` * `Sales` / `Clicks` * `Bid Multiplier`.  

On the Targeting page, you'll also see a new widget in the bottom left, where you can edit the:
- `Order Value` - how much your the book costs.
- `Target ACoS` - your target advertising cost of sales.
- `Bid Multipler` - as described above.
