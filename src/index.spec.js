import React from 'react'
import { mount, render } from 'enzyme'
import { spy, stub } from 'sinon'

const Dropzone = require(process.env.NODE_ENV === 'production' ? '../dist/index' : './index') // eslint-disable-line import/no-dynamic-require
const DummyChildComponent = () => null

let files
let images

describe('Dropzone', () => {
  beforeEach(() => {
    files = [
      {
        name: 'file1.pdf',
        size: 1111,
        type: 'application/pdf'
      }
    ]

    images = [
      {
        name: 'cats.gif',
        size: 1234,
        type: 'image/gif'
      },
      {
        name: 'dogs.jpg',
        size: 2345,
        type: 'image/jpeg'
      }
    ]
  })

  describe('basics', () => {
    it('should render children', () => {
      const dropzone = mount(
        <Dropzone>
          <p>some content</p>
        </Dropzone>
      )
      expect(dropzone.html()).toMatchSnapshot()
    })

    it('should render an input HTML element', () => {
      const dropzone = mount(
        <Dropzone>
          <p>some content</p>
        </Dropzone>
      )
      expect(dropzone.find('input').length).toEqual(1)
    })

    it('sets ref properly', () => {
      const dropzone = mount(<Dropzone />)
      expect(dropzone.instance().fileInputEl).not.toBeUndefined()
      expect(dropzone.instance().fileInputEl.tagName).toEqual('INPUT')
    })

    it('renders dynamic props on the root element', () => {
      const component = mount(<Dropzone hidden aria-hidden title="Dropzone" />)
      expect(component.html()).toContain('aria-hidden="true"')
      expect(component.html()).toContain('hidden=""')
      expect(component.html()).toContain('title="Dropzone"')
    })

    it('renders dynamic props on the input element', () => {
      const component = mount(<Dropzone inputProps={{ id: 'hiddenFileInput' }} />)
      expect(component.find('input').html()).toContain('id="hiddenFileInput"')
    })

    it('applies the accept prop to the child input', () => {
      const component = render(<Dropzone className="my-dropzone" accept="image/jpeg" />)
      expect(component.find('.my-dropzone').attr()).not.toContain('accept')
      expect(Object.keys(component.find('input').attr())).toContain('accept')
      expect(component.find('input').attr('accept')).toEqual('image/jpeg')
    })

    it('applies the name prop to the child input', () => {
      const component = render(<Dropzone className="my-dropzone" name="test-file-input" />)
      expect(component.find('.my-dropzone').attr()).not.toContain('name')
      expect(Object.keys(component.find('input').attr())).toContain('name')
      expect(component.find('input').attr('name')).toEqual('test-file-input')
    })

    it('should render children function', () => {
      const content = <p>some content</p>
      const dropzone = mount(
        <Dropzone>
          {content}
        </Dropzone>
      )
      const dropzoneWithFunction = mount(
        <Dropzone>
          {() => content}
        </Dropzone>
      )
      expect(dropzoneWithFunction.html()).toEqual(dropzone.html())
    })
  })

  describe('document drop protection', () => {
    let dropzone
    let addEventCalls
    let savedAddEventListener
    let savedRemoveEventListener

    beforeEach(() => {
      savedAddEventListener = document.addEventListener
      savedRemoveEventListener = document.removeEventListener
      document.addEventListener = spy()
      document.removeEventListener = spy()
    })

    afterEach(() => {
      document.addEventListener = savedAddEventListener
      document.removeEventListener = savedRemoveEventListener
    })

    // Collect the list of addEventListener/removeEventListener spy calls into an object keyed by event name.
    function collectEventListenerCalls(calls) {
      return calls.reduce((acc, [eventName, ...rest]) => {
        acc[eventName] = rest // eslint-disable-line no-param-reassign
        return acc
      }, {})
    }

    it('installs hooks to prevent stray drops from taking over the browser window', () => {
      dropzone = mount(<Dropzone><p>Content</p></Dropzone>)
      expect(dropzone.html()).toMatchSnapshot()
      expect(document.addEventListener.callCount).toEqual(2)
      addEventCalls = collectEventListenerCalls(document.addEventListener.args)
      Object.keys(addEventCalls).forEach(eventName => {
        expect(addEventCalls[eventName][0]).toBeDefined()
        expect(addEventCalls[eventName][1]).toBe(false)
      })
    })

    it('terminates drags and drops on elements outside our dropzone', () => {
      const event = { preventDefault: spy() }
      Dropzone.onDocumentDragOver(event)
      expect(event.preventDefault.callCount).toEqual(1)
      event.preventDefault.reset()

      dropzone.getNode().onDocumentDrop(event)
      expect(event.preventDefault.callCount).toEqual(1)
    })

    it('permits drags and drops on elements inside our dropzone', () => {
      const instanceEvent = {
        preventDefault: spy(),
        target: dropzone.getDOMNode()
      }
      dropzone.getNode().onDocumentDrop(instanceEvent)
      expect(instanceEvent.preventDefault.callCount).toEqual(0)
    })

    it('removes document hooks when unmounted', () => {
      dropzone.unmount()
      expect(document.removeEventListener.callCount).toEqual(2)
      const removeEventCalls = collectEventListenerCalls(document.removeEventListener.args)
      Object.keys(addEventCalls).forEach(eventName => {
        expect(removeEventCalls[eventName][0]).toEqual(addEventCalls[eventName][0])
      })
    })

    it('does not prevent stray drops when preventDropOnDocument is false', () => {
      dropzone = mount(<Dropzone preventDropOnDocument={false} />)
      expect(dropzone.html()).toMatchSnapshot()
      expect(document.addEventListener.callCount).toEqual(0)

      dropzone.unmount()
      expect(document.removeEventListener.callCount).toEqual(0)
    })
  })

  describe('onClick', () => {
    it('should call `open` method', done => {
      const dropzone = mount(<Dropzone />)
      spy(dropzone.instance(), 'open')
      dropzone.simulate('click')
      setTimeout(() => {
        expect(dropzone.instance().open.callCount).toEqual(1)
        done()
      }, 0)
    })

    it('should not call `open` if disableClick prop is true', () => {
      const dropzone = mount(<Dropzone disableClick />)
      spy(dropzone.instance(), 'open')
      dropzone.simulate('click')
      expect(dropzone.instance().open.callCount).toEqual(0)
    })

    it('should call `onClick` callback if provided', done => {
      const clickSpy = spy()
      const dropzone = mount(<Dropzone onClick={clickSpy} />)
      spy(dropzone.instance(), 'open')
      dropzone.simulate('click')
      setTimeout(() => {
        expect(dropzone.instance().open.callCount).toEqual(1)
        expect(clickSpy.callCount).toEqual(1)
        done()
      }, 0)
    })

    it('should reset the value of input', () => {
      const dropzone = mount(<Dropzone />)
      expect(dropzone.render().find('input').attr('value')).toBeUndefined()
      expect(dropzone.render().find('input').attr('value', 10)).not.toBeUndefined()
      dropzone.simulate('click')
      expect(dropzone.render().find('input').attr('value')).toBeUndefined()
    })

    it('should trigger click even on the input', done => {
      const dropzone = mount(<Dropzone />)
      const clickSpy = spy(dropzone.instance().fileInputEl, 'click')
      dropzone.simulate('click')
      dropzone.simulate('click')
      setTimeout(() => {
        expect(clickSpy.callCount).toEqual(2)
        done()
      }, 0)
    })

    it('should not invoke onClick on the wrapper', () => {
      const onClickOuterSpy = spy()
      const onClickInnerSpy = spy()
      const component = mount(
        <div onClick={onClickOuterSpy}>
          <Dropzone onClick={onClickInnerSpy} />
        </div>
      )

      component.simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(1)
      expect(onClickInnerSpy.callCount).toEqual(0)

      onClickOuterSpy.reset()
      onClickInnerSpy.reset()

      component.find('Dropzone').simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(0)
      expect(onClickInnerSpy.callCount).toEqual(1)
    })

    it('should invoke onClick on the wrapper if disableClick is set', () => {
      const onClickOuterSpy = spy()
      const component = mount(
        <div onClick={onClickOuterSpy}>
          <Dropzone disableClick />
        </div>
      )

      component.find('Dropzone').simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(1)
    })

    it('should invoke inputProps onClick if provided', done => {
      const inputPropsClickSpy = spy()
      const component = mount(<Dropzone inputProps={{ onClick: inputPropsClickSpy }} />)

      component.find('Dropzone').simulate('click')
      setTimeout(() => {
        expect(inputPropsClickSpy.callCount).toEqual(1)
        done()
      }, 0)
    })
  })

  describe('drag-n-drop', () => {
    it('should override onDrag* methods', () => {
      const dragStartSpy = spy()
      const dragEnterSpy = spy()
      const dragOverSpy = spy()
      const dragLeaveSpy = spy()
      const component = mount(
        <Dropzone
          onDragStart={dragStartSpy}
          onDragEnter={dragEnterSpy}
          onDragOver={dragOverSpy}
          onDragLeave={dragLeaveSpy}
        />
      )
      component.simulate('dragStart')
      component.simulate('dragEnter', { dataTransfer: { items: files } })
      component.simulate('dragOver', { dataTransfer: { items: files } })
      component.simulate('dragLeave', { dataTransfer: { items: files } })
      expect(dragStartSpy.callCount).toEqual(1)
      expect(dragEnterSpy.callCount).toEqual(1)
      expect(dragOverSpy.callCount).toEqual(1)
      expect(dragLeaveSpy.callCount).toEqual(1)
    })

    it('should guard dropEffect in onDragOver for IE', () => {
      const dragStartSpy = spy()
      const dragEnterSpy = spy()
      const dragLeaveSpy = spy()
      const component = mount(
        <Dropzone
          onDragStart={dragStartSpy}
          onDragEnter={dragEnterSpy}
          onDragLeave={dragLeaveSpy}
        />
      )

      // Using Proxy we'll emulate IE throwing when setting dataTransfer.dropEffect
      const eventProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            switch (prop) {
              case 'dataTransfer':
                throw new Error('IE does not support rrror')
              default:
                return function noop() {}
            }
          }
        }
      )

      // And using then we'll call the onDragOver with the proxy instead of event
      const dragOverSpy = stub(
        component.instance(),
        'onDragOver',
        component.instance().onDragOver(eventProxy)
      )

      component.simulate('dragStart', { dataTransfer: { items: files } })
      component.simulate('dragEnter', { dataTransfer: { items: files } })
      component.simulate('dragOver', { dataTransfer: { items: files } })
      component.simulate('dragLeave', { dataTransfer: { items: files } })
      expect(dragStartSpy.callCount).toEqual(1)
      expect(dragEnterSpy.callCount).toEqual(1)
      expect(dragLeaveSpy.callCount).toEqual(1)
      // It should not throw the error
      expect(dragOverSpy).not.toThrow()
      dragOverSpy.restore()
    })

    it('should set proper dragActive state on dragEnter', () => {
      const dropzone = mount(
        <Dropzone>
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragReject', false)
    })

    it('should set proper dragReject state on dragEnter', () => {
      const dropzone = mount(
        <Dropzone accept="image/*">
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files: files.concat(images) } })
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set proper dragActive state if multiple is false', () => {
      const dropzone = mount(
        <Dropzone accept="image/*" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set proper dragActive state if multiple is false', () => {
      const dropzone = mount(
        <Dropzone accept="image/*" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set proper dragActive state if accept prop changes mid-drag', () => {
      const dropzone = mount(
        <Dropzone accept="image/*">
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragReject', false)

      dropzone.setProps({ accept: 'text/*' })
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should expose state to children', () => {
      const dropzone = mount(
        <Dropzone accept="image/*">
          {({ isDragActive, isDragReject }) => {
            if (isDragReject) {
              return 'Rejected'
            }
            if (isDragActive) {
              return 'Active'
            }
            return 'Empty'
          }}
        </Dropzone>
      )
      expect(dropzone.text()).toEqual('Empty')
      dropzone.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(dropzone.text()).toEqual('Active')
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      expect(dropzone.text()).toEqual('Rejected')
    })

    it('should reset the dragActive/dragReject state when leaving after a child goes away', () => {
      const DragActiveComponent = () => <p>Active</p>
      const ChildComponent = () => <p>Child component content</p>
      const dropzone = mount(
        <Dropzone>
          {({ isDragActive, isDragReject }) => {
            if (isDragReject) {
              return 'Rejected'
            }
            if (isDragActive) {
              return <DragActiveComponent isDragActive={isDragActive} isDragReject={isDragReject} />
            }
            return <ChildComponent isDragActive={isDragActive} isDragReject={isDragReject} />
          }}
        </Dropzone>
      )
      const child = dropzone.find(ChildComponent)
      child.simulate('dragEnter', { dataTransfer: { files } })
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      // make sure we handle any duplicate dragEnter events that the browser may send us
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      const dragActiveChild = dropzone.find(DragActiveComponent)
      expect(dragActiveChild).toBePresent()
      expect(dragActiveChild).toHaveProp('isDragActive', true)
      expect(dragActiveChild).toHaveProp('isDragReject', false)

      dropzone.simulate('dragLeave', { dataTransfer: { files } })
      expect(dropzone.find(DragActiveComponent)).toBeEmpty()
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', false)
    })
  })

  describe('onDrop', () => {
    let dropSpy
    let dropAcceptedSpy
    let dropRejectedSpy

    beforeEach(() => {
      dropSpy = spy()
      dropAcceptedSpy = spy()
      dropRejectedSpy = spy()
    })

    afterEach(() => {
      dropSpy.reset()
      dropAcceptedSpy.reset()
      dropRejectedSpy.reset()
    })

    it('should reset the dragActive/dragReject state', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        >
          {props => <DummyChildComponent {...props} />}
        </Dropzone>
      )
      const child = dropzone.find(DummyChildComponent)
      dropzone.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragReject', false)
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', false)
    })

    it('should add valid files to rejected files on a multple drop when multiple false', () => {
      const dropzone = mount(<Dropzone accept="image/*" onDrop={dropSpy} multiple={false} />)
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      const rejected = dropSpy.firstCall.args[0]
      expect(rejected.length).toEqual(1)
    })

    it('should add invalid files to rejected when multiple is false', () => {
      const dropzone = mount(<Dropzone accept="image/*" onDrop={dropSpy} multiple={false} />)
      dropzone.simulate('drop', { dataTransfer: { files: images.concat(files) } })
      const rejected = dropSpy.firstCall.args[1]
      expect(rejected.length).toEqual(2)
    })

    it('should allow single files to be dropped if multiple is false', () => {
      const dropzone = mount(<Dropzone accept="image/*" onDrop={dropSpy} multiple={false} />)

      dropzone.simulate('drop', { dataTransfer: { files: [images[0]] } })
      const [accepted, rejected] = dropSpy.firstCall.args
      expect(accepted.length).toEqual(1)
      expect(rejected.length).toEqual(0)
    })

    it('should take all dropped files if multiple is true', () => {
      const dropzone = mount(<Dropzone onDrop={dropSpy} multiple />)
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[0][0].name).toEqual(images[0].name)
      expect(dropSpy.firstCall.args[0][1].name).toEqual(images[1].name)
    })

    it('should set this.isFileDialogActive to false', () => {
      const dropzone = mount(<Dropzone />)
      dropzone.instance().isFileDialogActive = true
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropzone.instance().isFileDialogActive).toEqual(false)
    })

    it('should always call onDrop callback with accepted and rejected arguments', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toEqual([], [...files])
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(2)
      expect(dropSpy.lastCall.args[0]).toEqual([...images], [])
      dropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      expect(dropSpy.callCount).toEqual(3)
      expect(dropSpy.lastCall.args[0]).toEqual([...images], [...files])
    })

    it('should call onDropAccepted callback if some files were accepted', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropAcceptedSpy.callCount).toEqual(0)
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.lastCall.args[0]).toEqual([...images])
      dropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      expect(dropAcceptedSpy.callCount).toEqual(2)
      expect(dropAcceptedSpy.lastCall.args[0]).toEqual([...images])
    })

    it('should call onDropRejected callback if some files were rejected', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.lastCall.args[0]).toEqual([...files])
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropRejectedSpy.callCount).toEqual(1)
      dropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      expect(dropRejectedSpy.callCount).toEqual(2)
      expect(dropRejectedSpy.lastCall.args[0]).toEqual([...files])
    })

    it('applies the accept prop to the dropped files', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(1)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(1)
    })

    it('applies the accept prop to the dropped images', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )

      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts a dropped image when Firefox provides a bogus file type', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      const bogusImages = [
        {
          name: 'bogus.gif',
          size: 1234,
          type: 'application/x-moz-file'
        }
      ]

      dropzone.simulate('drop', { dataTransfer: { files: bogusImages } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts all dropped files and images when no accept prop is specified', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('applies the maxSize prop to the dropped files', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          maxSize={1111}
        />
      )

      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('applies the maxSize prop to the dropped images', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          maxSize={1111}
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(2)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(2)
    })

    it('applies the minSize prop to the dropped files', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          minSize={1112}
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(1)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(1)
    })

    it('applies the minSize prop to the dropped images', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          minSize={1112}
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts all dropped files and images when no size prop is specified', () => {
      const dropzone = mount(
        <Dropzone
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        />
      )
      dropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })
  })

  describe('preview', () => {
    it('should generate previews for non-images', () => {
      const dropSpy = spy()
      const dropzone = mount(<Dropzone onDrop={dropSpy} />)
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(Object.keys(dropSpy.firstCall.args[0][0])).toContain('preview')
      expect(dropSpy.firstCall.args[0][0].preview).toContain('data://file1.pdf')
    })

    it('should generate previews for images', () => {
      const dropSpy = spy()
      const dropzone = mount(<Dropzone onDrop={dropSpy} />)
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      expect(Object.keys(dropSpy.firstCall.args[0][0])).toContain('preview')
      expect(dropSpy.firstCall.args[0][0].preview).toContain('data://cats.gif')
    })

    it('should not throw error when preview cannot be created', () => {
      const dropSpy = spy()
      const dropzone = mount(<Dropzone onDrop={dropSpy} />)

      dropzone.simulate('drop', { dataTransfer: { files: ['bad_val'] } })

      expect(Object.keys(dropSpy.firstCall.args[1][0])).not.toContain('preview')
    })

    it('should not generate previews if disablePreview is true', () => {
      const dropSpy = spy()
      const dropzone = mount(<Dropzone disablePreview onDrop={dropSpy} />)
      dropzone.simulate('drop', { dataTransfer: { files: images } })
      dropzone.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(2)
      expect(Object.keys(dropSpy.firstCall.args[0][0])).not.toContain('preview')
      expect(Object.keys(dropSpy.lastCall.args[0][0])).not.toContain('preview')
    })
  })

  describe('onClick', () => {})

  describe('onCancel', () => {
    it('should not invoke onFileDialogCancel everytime window receives focus', done => {
      const onCancelSpy = spy()
      mount(<Dropzone id="on-cancel-example" onFileDialogCancel={onCancelSpy} />)
      // Simulated DOM event - onfocus
      document.body.addEventListener('focus', () => {})
      const evt = document.createEvent('HTMLEvents')
      evt.initEvent('focus', false, true)
      document.body.dispatchEvent(evt)
      // setTimeout to match the event callback from actual Component
      setTimeout(() => {
        expect(onCancelSpy.callCount).toEqual(0)
        done()
      }, 300)
    })

    it('should invoke onFileDialogCancel when window receives focus via cancel button', done => {
      const onCancelSpy = spy()
      const component = mount(
        <Dropzone className="dropzone-content" onFileDialogCancel={onCancelSpy} />
      )

      // Test / invoke the click event
      spy(component.instance(), 'open')
      component.simulate('click')

      setTimeout(() => {
        expect(component.instance().open.callCount).toEqual(1)

        // Simulated DOM event - onfocus
        document.body.addEventListener('focus', () => {})
        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('focus', false, true)
        document.body.dispatchEvent(evt)

        // setTimeout to match the event callback from actual Component
        setTimeout(() => {
          expect(onCancelSpy.callCount).toEqual(1)
          done()
        }, 300)
      }, 0)
    })
  })

  describe('nested Dropzone component behavior', () => {
    let outerDropzone
    let innerDropzone
    let outerDropSpy
    let outerDropAcceptedSpy
    let outerDropRejectedSpy
    let innerDropSpy
    let innerDropAcceptedSpy
    let innerDropRejectedSpy

    const InnerDragAccepted = () => <p>Accepted</p>
    const InnerDragRejected = () => <p>Rejected</p>
    const InnerDropzone = () => (
      <Dropzone
        onDrop={innerDropSpy}
        onDropAccepted={innerDropAcceptedSpy}
        onDropRejected={innerDropRejectedSpy}
        accept="image/*"
      >
        {({ isDragActive, isDragReject }) => {
          if (isDragReject) return <InnerDragRejected />
          if (isDragActive) return <InnerDragAccepted />
          return <p>No drag</p>
        }}
      </Dropzone>
    )

    describe('dropping on the inner dropzone', () => {
      it('mounts both dropzones', () => {
        outerDropSpy = spy()
        outerDropAcceptedSpy = spy()
        outerDropRejectedSpy = spy()
        innerDropSpy = spy()
        innerDropAcceptedSpy = spy()
        innerDropRejectedSpy = spy()
        outerDropzone = mount(
          <Dropzone
            onDrop={outerDropSpy}
            onDropAccepted={outerDropAcceptedSpy}
            onDropRejected={outerDropRejectedSpy}
            accept="image/*"
          >
            {props => <InnerDropzone {...props} />}
          </Dropzone>
        )
        innerDropzone = outerDropzone.find(InnerDropzone)
      })

      it('does dragEnter on both dropzones', () => {
        innerDropzone.simulate('dragEnter', { dataTransfer: { files: images } })
        expect(innerDropzone).toHaveProp('isDragActive', true)
        expect(innerDropzone).toHaveProp('isDragReject', false)
        expect(innerDropzone.find(InnerDragAccepted).exists()).toEqual(true)
        expect(innerDropzone.find(InnerDragRejected).exists()).toEqual(false)
      })

      it('drops on the child dropzone', () => {
        innerDropzone.simulate('drop', { dataTransfer: { files: files.concat(images) } })
      })

      it('accepts the drop on the inner dropzone', () => {
        expect(innerDropSpy.callCount).toEqual(1)
        expect(innerDropSpy.firstCall.args[0]).toHaveLength(2)
        expect(innerDropSpy.firstCall.args[1]).toHaveLength(1)
        expect(innerDropAcceptedSpy.callCount).toEqual(1)
        expect(innerDropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
        expect(innerDropRejectedSpy.callCount).toEqual(1)
        expect(innerDropRejectedSpy.firstCall.args[0]).toHaveLength(1)
        expect(innerDropzone.find(InnerDragAccepted).exists()).toEqual(false)
        expect(innerDropzone.find(InnerDragRejected).exists()).toEqual(false)
      })

      it('also accepts the drop on the outer dropzone', () => {
        expect(outerDropSpy.callCount).toEqual(1)
        expect(outerDropSpy.firstCall.args[0]).toHaveLength(2)
        expect(outerDropSpy.firstCall.args[1]).toHaveLength(1)
        expect(outerDropAcceptedSpy.callCount).toEqual(1)
        expect(outerDropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
        expect(outerDropRejectedSpy.callCount).toEqual(1)
        expect(outerDropRejectedSpy.firstCall.args[0]).toHaveLength(1)
        expect(innerDropzone).toHaveProp('isDragActive', false)
        expect(innerDropzone).toHaveProp('isDragReject', false)
      })
    })
  })

  describe('behavior', () => {
    it('does not throw an error when html is dropped instead of files and multiple is false', () => {
      const dropzone = mount(<Dropzone multiple={false} />)

      const fn = () => dropzone.simulate('drop', { dataTransfer: { files: [] } })
      expect(fn).not.toThrow()
    })
  })
})
